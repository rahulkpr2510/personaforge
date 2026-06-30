import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export async function uploadScreenshot(
  buffer: Buffer,
  fileName: string,
  folder = "/personaforge/screenshots",
): Promise<string> {
  const result = await imagekit.upload({
    file: buffer.toString("base64"),
    fileName,
    folder,
    useUniqueFileName: true,
  });
  return result.url;
}
