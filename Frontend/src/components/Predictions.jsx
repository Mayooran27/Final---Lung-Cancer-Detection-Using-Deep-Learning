import React, { useState, useEffect } from 'react';
import * as ml5 from 'ml5';
import { ModelURL } from '../ModelUrl';
import { Link } from 'react-router-dom';

const Predictions = ({ url }) => {
  const [prediction, setPrediction] = useState([]);
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(true);
  let imageModelURL = "https://teachablemachine.withgoogle.com/models/72SAaZk4T/";

  const classifier = ml5.imageClassifier(imageModelURL + 'model.json');
  
  // .then((res) => console.log(res));

  const covertPercentage = (inputNum) => {
    return parseFloat(inputNum * 100).toFixed(2);
  };
  useEffect(() => {
    const classifyImg = () => {
      let img = document.getElementById('image');

      if (url != null) {
        img.src = url;
      }

      classifier.then((res) =>
        res
          .predict(img, 5, function (err, res) {
            console.log(err, 'Res');
            // return res;
          })
          .then((res) => {
            console.log(res, 'Then Res');
            setResult(res);
            setLoading(false);
          }),
      );
    };
    classifyImg();
    // setTimeout(function () {
    //   setPrediction("");
    // }, 500);
  }, [prediction, url]);

  return (
    <div className='flex flex-col justify-center lg:justify-evenly lg:space-x-8 items-center'>
      <div className='w-[300px] md:w-[450px]'>
        <img src='' id='image' alt='' />
      </div>
      {loading ? (
        <div className='py-2.5 px-5 mr-2 my-4 lg:mx-auto text-xl font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 inline-flex items-center'>
          <svg
            role='status'
            class='inline mr-2 w-4 h-4 text-gray-200 animate-spin dark:text-gray-600'
            viewBox='0 0 100 101'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
              fill='currentColor'
            />
            <path
              d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
              fill='#1C64F2'
            />
          </svg>
          Loading...
        </div>
      ) : (
          <div className='flex flex-col justify-center items-center max-w-[80vw] md:max-w-[500px] mx-auto text-xl'>
          {result[0]?.label === "Random" && <div role="alert" className='mt-4'>
          <div className="bg-red-500 text-white font-bold rounded-t px-4 py-2">
            Something Wrong
          </div>
          <div className="border border-t-0 border-red-400 rounded-b bg-red-100 px-4 py-3 text-red-700">
            <p>Something not ideal might be happening. Please check your uploaded image is correct or not</p>
          </div>
        </div>}
          <div className='my-4'>
            <p className='text-center text-3xl'>
              <span className=''>Model Says,</span>
                This is{' '}
              {result[0]?.label} {result[0]?.label !== "Random" && "Case"}
            </p>
          </div>
          <div>
            <Link
              to='/'
              className='flex items-center justify-center rounded-xl text-[#FFF] border-[#020528] bg-[#0148B4] font-bold py-2 px-3 mt-4 cursor-pointer'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='36'
                height='36'
                fill='currentColor'
                class='bi bi-arrow-left-short'
                viewBox='0 0 16 16'
              >
                {' '}
                <path
                  fill-rule='evenodd'
                  d='M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5z'
                />{' '}
              </svg>
              <span>Predict Again</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Predictions;
