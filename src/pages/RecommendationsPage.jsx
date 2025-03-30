import React, { useState, useEffect } from 'react';

function RecommendationsPage() {

  const dictionary = {
    "GENRE": ['Pop', 'Rock', 'Rap', 'Latin', 'EDM', 'R&B'],
    "MOOD": ['Happy', 'Sad', 'Energetic', 'Angry', 'Relaxed', 'Calm'],
  };

  let [tableData, setTableData] = useState([]);

  const initialCheckedItems = Object.keys(dictionary).reduce((acc, category) => {
    acc[category] = [];
    return acc;
  }, {});

  const [isOpen, setIsOpen] = useState({});
  const [checkedItems, setCheckedItems] = useState(initialCheckedItems);

  const handleCheckChange = (event, category) => {
    const item = event.target.name;

    // Compute the new checked items based on the event
    const newCheckedItems = {
      ...checkedItems,
      [category]: event.target.checked
        ? [...checkedItems[category], item]
        : checkedItems[category].filter(i => i !== item),
    };

    // Update state with the new checked items
    setCheckedItems(newCheckedItems);

    // Use the new checked items for the fetch call
    const selectedGenres = newCheckedItems['GENRE'];
    const selectedMoods = newCheckedItems['MOOD'];

    fetch(`http://localhost:3002/recommendations/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        genres: selectedGenres,
        moods: selectedMoods
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setTableData(data.data);
        console.log(data.data);
      })
      .catch((error) => {
        console.error("Error fetching recommendations:", error);
      });
  };

  useEffect(() => {
    console.log(tableData); // Logs the updated table data
  }, [tableData]);

  useEffect(() => {
    console.log(checkedItems); // Logs the updated checked items
  }, [checkedItems]);

  const toggleDropdown = (category) => {
    setIsOpen(prevState => ({ ...prevState, [category]: !prevState[category] }));
  };
  
  return (
    // Outer Div
    <main>
    <p className='text-3xl flex items-center justify-center mt-[2vh]'>Find Your Perfect Song!</p>
    <div className='flex flex-row gap-10 items-center justify-center'>
      {Object.keys(dictionary).map(category => (
    // Div for individual dropdown
    
    
        <div className='w-64 bg-slate-500 h-12 rounded-lg flex flex-col items-center justify-start pt-3 mt-[5vh]' key={category}
            onMouseEnter={() => setIsOpen({ [category]: true })}
            onMouseLeave={() => setIsOpen({ [category]: false })}>
          <button className='text-xl font-bold' onClick={() => toggleDropdown(category)}>{category}</button>
          {isOpen[category] && (
    // Div for all the items in the dropdown
            <div className='grid'>
              {dictionary[category].map(item => (
    // Div for individual item in the dropdown
                <div className='h-8 w-52 bg-slate-900 text-white place-items-center rounded-lg z-10' key={item}>
                  <label className='grid grid-cols-2 place-items-center'>
                    <input type="checkbox" name={item} checked={checkedItems[category ].includes(item)} onChange={(event) => handleCheckChange(event, category)} />
                    {item}
                  </label>
                  
                </div>
              ))}
            </div>
          )}
        </div>
        
      ))}
    </div>
      <div className=''>
      <table className='mt-5 w-[80vw] m-auto border-black border border-spacing-5'>
        <thead className=' bg-[#1DB954] border-2 border-black'>
          <tr className='w-full m-auto grid items-center justify-center text-xl grid-cols-5 p-5'>
            <th>S. No.</th>
            <th>Song</th>
            <th>Artist</th>
            <th>Genre</th>
            <th>Mood</th>

            
          </tr>
        </thead>
      <tbody>

      {tableData.map(crop => (
        <tr className='w-full m-auto grid items-center justify-center text-xl grid-cols-5 p-5 border-[0.5px] border-slate-600'>

          {Object.keys(crop).map((key) => (
            <th>{crop[key]}</th>
          ))}
        </tr>
      ))}
      </tbody>
      </table>
      </div>
    </main>
    
  );
}

export default RecommendationsPage