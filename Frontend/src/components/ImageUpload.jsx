import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const ImageUpload = () => {
  const [images, setImages] = useState([]);
  const [imageURLs, setImageURLs] = useState([]);

  const onReadImage = (e) => {
    setImages([...e.target.files]);
  };

  useEffect(() => {
    if (images.length < 1) return;
    const newImageUrls = [];
    images.forEach((image) => newImageUrls.push(URL.createObjectURL(image)));
    setImageURLs(newImageUrls);
  }, [images]);

  return (
    <div className="flex justify-center mt-14 md:mt-0">
      <div className="max-w-2xl rounded-lg shadow-xl bg-gray-50">
        <div className="m-4">
          <label className="inline-block mb-2 text-[#020A0D]">
            Upload Image(jpg,png,svg,jpeg)
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col w-full h-32 border-4 border-[#020A0D] border-dashed hover:bg-gray-100 hover:border-gray-300">
              <div className="flex flex-col items-center justify-center pt-7">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-[#020A0D] group-hover:text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="pt-1 text-sm tracking-wider text-[#020A0D] group-hover:text-gray-600">
                  Upload Image
                </p>
              </div>
              <input
                type="file"
                // multiple
                accept="image/*"
                required
                onChange={onReadImage}
                className="opacity-0"
              />
            </label>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-black text-center font-semibold text-xl">
            {imageURLs.length > 0 ? `Image Uploaded` : ""}
          </span>
        </div>
        <div className="flex justify-center p-2 pb-4">
          <Link
            to={`/${imageURLs.length > 0 ? "results" : ""}`}
            state={{ data: imageURLs }}
            // className="outline-2 outline-[#05F258]/50"
            className="w-36 text-center text-xl px-4 py-2 border-2 text-[#FFF] border-[#020528] bg-[#0148B4] rounded shadow-xl"
          >
            Check
          </Link>
        </div>
        {/* <div className="flex flex-col">
          {imageURLs.map((url) => (
            <div className="bg-indigo-300 " key={url}>
              <img className="object-contain" src={url} />
            </div>
          ))}
        </div> */}
      </div>
    </div>
  );
};

export default ImageUpload;
