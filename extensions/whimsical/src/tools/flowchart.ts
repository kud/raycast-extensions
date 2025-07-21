type Input = {
  query: string;
};

type FlowchartResponse = {
  imageURL: string;
  fileURL: string;
};

export default async function (input: Input) {
  const res = await fetch("https://whimsical.com/api/ai.chatgpt.render-flowchart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mermaid: input.query, title: input.query.slice(0, 50) }),
  });
  const { imageURL, fileURL } = (await res.json()) as FlowchartResponse;
  const img = await fetch(imageURL);
  const buf = await img.arrayBuffer();
  const mimeType = img.headers.get("content-type") ?? "image/png";
  return {
    content: [
      { type: "text", text: fileURL },
      { type: "image", data: Buffer.from(buf).toString("base64"), mimeType },
      { type: "resource", resource: { uri: fileURL, text: "Open in Whimsical" } },
    ],
  };
}
