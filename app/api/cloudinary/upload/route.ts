import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary config should be server-side only.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = "nodejs";

type UploadResult = {
  secure_url: string;
};

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data" },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const folder = formData.get("folder");
    const uploadPreset = formData.get("uploadPreset"); // optional

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!folder || typeof folder !== "string") {
      return NextResponse.json({ error: "Missing folder" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<UploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
          ...(uploadPreset && typeof uploadPreset === "string"
            ? { upload_preset: uploadPreset }
            : {}),
        },
        (error: any, uploaded?: UploadResult) => {
          if (error) return reject(error);
          if (!uploaded) return reject(new Error("No upload result"));
          resolve(uploaded);
        },
      );

      uploadStream.end(buffer);
    });

    return NextResponse.json({ secureUrl: result.secure_url });
  } catch (err: any) {
    console.error("Cloudinary upload error:", err);
    return NextResponse.json(
      { error: err?.message || "Cloudinary upload failed" },
      { status: 500 },
    );
  }
}

