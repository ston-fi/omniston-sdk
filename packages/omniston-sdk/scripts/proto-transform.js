import path from "node:path";
import protobuf from "protobufjs";
import ts from "typescript";

export function buildProtoFileRules({ protoDir, protoFilePath }) {
  const root = new protobuf.Root();
  root.resolvePath = (_origin, target) => {
    if (path.isAbsolute(target)) {
      return target;
    }
    return path.resolve(protoDir, target);
  };

  const normalizedProtoPath = path.resolve(protoFilePath);
  const relativeProtoPath = path.relative(protoDir, normalizedProtoPath).replace(/\\/g, "/");

  root.loadSync([relativeProtoPath], { keepCase: false });
  root.resolveAll();

  const messageRules = new Map();
  collectProtoFileRules({
    namespace: root,
    targetProtoPath: normalizedProtoPath,
    messageRules,
  });

  return messageRules;
}

function collectProtoFileRules({
  namespace,
  targetProtoPath,
  messageRules,
  parentMessageNames = [],
}) {
  const nested = namespace?.nestedArray ?? [];

  for (const item of nested) {
    if (item instanceof protobuf.Type) {
      if (!item.filename || path.resolve(item.filename) !== targetProtoPath) {
        continue;
      }

      const messageName = [...parentMessageNames, item.name].join("_");
      messageRules.set(messageName, {
        optionalFields: new Set(
          item.fieldsArray
            .filter((field) => field?.options?.proto3_optional === true)
            .map((field) => field.name),
        ),
      });

      collectProtoFileRules({
        namespace: item,
        targetProtoPath,
        messageRules,
        parentMessageNames: [...parentMessageNames, item.name],
      });
      continue;
    }

    if (item instanceof protobuf.Namespace) {
      collectProtoFileRules({
        namespace: item,
        targetProtoPath,
        messageRules,
        parentMessageNames,
      });
    }
  }
}

export function transformGeneratedContent(content, messageRules) {
  const sourceFile = ts.createSourceFile(
    "generated.ts",
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const printer = ts.createPrinter();
  const edits = [];

  const visit = (node) => {
    if (
      ts.isInterfaceDeclaration(node) &&
      node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      const messageRule = messageRules.get(node.name.text);
      if (!messageRule) {
        return;
      }

      for (const member of node.members) {
        if (!ts.isPropertySignature(member)) {
          continue;
        }

        const nextMember = transformProtoAstNode(member, messageRule);
        if (nextMember === member) {
          continue;
        }

        if (member.questionToken && !nextMember.questionToken) {
          edits.push({
            start: member.questionToken.getStart(sourceFile),
            end: member.questionToken.end,
            text: "",
          });
        }

        if (member.type && nextMember.type && member.type !== nextMember.type) {
          edits.push({
            start: member.type.getStart(sourceFile),
            end: member.type.end,
            text: printer.printNode(ts.EmitHint.Unspecified, nextMember.type, sourceFile),
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return applyTextEdits(content, edits);
}

export function transformProtoAstNode(node, context) {
  if (!ts.isPropertySignature(node)) {
    return node;
  }

  const propertyName = getPropertyName(node.name);
  if (!propertyName || context.optionalFields.has(propertyName)) {
    return node;
  }

  const nextType = node.type ? stripUndefinedFromTypeNode(node.type) : node.type;
  const hasChanges = node.questionToken || nextType !== node.type;

  if (!hasChanges) {
    return node;
  }

  return ts.factory.updatePropertySignature(node, node.modifiers, node.name, undefined, nextType);
}

function getPropertyName(nameNode) {
  if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode)) {
    return nameNode.text;
  }

  if (ts.isNumericLiteral(nameNode)) {
    return nameNode.text;
  }

  return null;
}

function stripUndefinedFromTypeNode(typeNode) {
  if (ts.isParenthesizedTypeNode(typeNode)) {
    const nextInnerType = stripUndefinedFromTypeNode(typeNode.type);
    if (nextInnerType === typeNode.type) {
      return typeNode;
    }
    return ts.factory.updateParenthesizedType(typeNode, nextInnerType);
  }

  if (!ts.isUnionTypeNode(typeNode)) {
    return typeNode;
  }

  const nextTypes = typeNode.types
    .map((unionTypeNode) => stripUndefinedFromTypeNode(unionTypeNode))
    .filter((unionTypeNode) => !isUndefinedTypeNode(unionTypeNode));

  if (nextTypes.length === 0) {
    return typeNode;
  }

  if (nextTypes.length === 1) {
    return nextTypes[0];
  }

  return ts.factory.updateUnionTypeNode(typeNode, nextTypes);
}

function isUndefinedTypeNode(typeNode) {
  if (typeNode.kind === ts.SyntaxKind.UndefinedKeyword) {
    return true;
  }

  if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
    return typeNode.typeName.text === "undefined";
  }

  return false;
}

function applyTextEdits(content, edits) {
  if (edits.length === 0) {
    return content;
  }

  const sortedEdits = [...edits]
    .filter((edit) => edit.end > edit.start)
    .sort((a, b) => b.start - a.start);

  let output = content;
  let lastStart = Number.POSITIVE_INFINITY;

  for (const edit of sortedEdits) {
    if (edit.end > lastStart) {
      continue;
    }

    output = `${output.slice(0, edit.start)}${edit.text}${output.slice(edit.end)}`;
    lastStart = edit.start;
  }

  return output;
}
