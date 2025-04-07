import { TextWithEntities } from "@mtcute/node";

function unparseMarkdown(textWithEntities: TextWithEntities): string {
  if (!textWithEntities.entities) {
    return textWithEntities.text;
  }

  let textArray = textWithEntities.text.split("");

  let formattingMap: Record<string, string> = {
    messageEntityBold: "**",
    messageEntityItalic: "__",
    messageEntityUnderline: "--",
    messageEntityStrike: "~~",
    messageEntityCode: "`",
    messageEntitySpoiler: "||",
  };

  let entities = [...textWithEntities.entities].sort(
    (a, b) => a.offset - b.offset,
  );

  let insertions: { index: number; value: string }[] = [];

  for (const entity of entities) {
    if (entity._ === "messageEntityPre") {
      const language = entity.language ? entity.language : "";
      insertions.push({ index: entity.offset, value: "```" + language + "\n" });
      insertions.push({ index: entity.offset + entity.length, value: "\n```" });
    } else {
      const format = formattingMap[entity._];
      if (format) {
        insertions.push({ index: entity.offset, value: format });
        insertions.push({
          index: entity.offset + entity.length,
          value: format,
        });
      }
    }
  }

  insertions.sort((a, b) => b.index - a.index);

  for (const insertion of insertions) {
    textArray.splice(insertion.index, 0, insertion.value);
  }

  return textArray.join("");
}

export { unparseMarkdown };
