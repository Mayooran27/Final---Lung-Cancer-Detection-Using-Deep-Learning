import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Predictions from './Predictions';

const Results = () => {
  const [imageUrls, setImageUrls] = useState([]);
  const location = useLocation();

  useEffect(() => {
    setImageUrls(location.state.data);
    console.log(location.state);
  }, [location]);

  return (
    <div className='flex flex-col items-center justify-center'>
      <h1 className='font-bold text-3xl lg:text-4xl mb-4 '>
        Prediction Results
      </h1>
      <div className='grid grid-cols-1'>
        {imageUrls?.map((url, index) => (
          <Predictions url={url} key={index} />
        ))}
      </div>
    </div>
  );
};

export default Results;
