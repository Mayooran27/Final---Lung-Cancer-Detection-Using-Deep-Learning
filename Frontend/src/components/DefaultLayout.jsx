import React from "react";
import { Link } from "react-router-dom";

const DefaultLayout = ({ children }) => {
  return (
    <div className="min-h-[100vh] bg-gradient-to-r from-[#030117] via-[#01195F]  to-[#030117]">
      <div className="flex flex-col mx-auto justify-center items-center p-4 md:max-w-[800px]  text-white">
        <Link to="/" className="flex justify-center  items-center  mb-8 ">
          <img src="../../../bg.png" alt="" className="w-40 h-auto" />
          <h1 className="text-3xl font-bold">Lung Cancer Detection System</h1>
        </Link>

        <p className="text-white text-center max-w-[100%] md:max-w-[100%] lg:md:max-w-[100%] mx-auto my-0 font-bold text-xl pt-2 pb-4">
        This project presents lung cancer detection based on CT images by efficiently Predicting lung cancer using deep learning classification models. Pre-processd images are used to train CNN,VGG16,InceptionV3 architecture. The main objective of this study is to detect whether the tumor presents in a patient's lung is Malignant or Bengin(normal).A web application is built and integrated with a model that detects the tumor and the prediction is displayed for uploaded CT. 
      </p>
        {children}
      </div>
      
    </div>
  );
};




export default DefaultLayout;
