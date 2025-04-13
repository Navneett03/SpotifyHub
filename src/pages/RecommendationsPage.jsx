import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from "../contexts/AuthContext";

function RecommendationsPage() {
  const { token } = useContext(AuthContext);

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

  const fetchRecommendations = (selectedGenres, selectedMoods) => {
    fetch(`http://localhost:3002/recommendations/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: token,
        genres: selectedGenres,
        moods: selectedMoods
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setTableData(data.data);
        console.log("Fetched on mount or update:", data.data);
      })
      .catch((error) => {
        console.error("Error fetching recommendations:", error);
      });
  };

  const handleCheckChange = (event, category) => {
    const item = event.target.name;
    const newCheckedItems = {
      ...checkedItems,
      [category]: event.target.checked
        ? [...checkedItems[category], item]
        : checkedItems[category].filter(i => i !== item),
    };
    setCheckedItems(newCheckedItems);

    const selectedGenres = newCheckedItems['GENRE'];
    const selectedMoods = newCheckedItems['MOOD'];
    fetchRecommendations(selectedGenres, selectedMoods);
  };

  // Run once on component mount
  useEffect(() => {
    fetchRecommendations([], []);
  }, []);

  useEffect(() => {
    console.log("Checked items updated:", checkedItems);
  }, [checkedItems]);

  useEffect(() => {
    console.log("Table data updated:", tableData);
  }, [tableData]);

  const toggleDropdown = (category) => {
    setIsOpen(prevState => ({ ...prevState, [category]: !prevState[category] }));
  };

  return (
    <main>
      <p className="text-3xl flex items-center justify-center mt-[2vh]">
        Find Your Perfect Song!
      </p>
      <div className="flex flex-row gap-10 items-center justify-center">
        {Object.keys(dictionary).map((category) => (
          <div
            className="w-64 bg-slate-500 h-12 rounded-lg flex flex-col items-center justify-start pt-3 mt-[5vh]"
            key={category}
            onMouseEnter={() => setIsOpen({ [category]: true })}
            onMouseLeave={() => setIsOpen({ [category]: false })}
          >
            <button
              className="text-xl font-bold"
              onClick={() => toggleDropdown(category)}
            >
              {category}
            </button>
            {isOpen[category] && (
              <div className="grid">
                {dictionary[category].map((item) => (
                  <div
                    className="h-8 w-52 bg-slate-900 text-white place-items-center rounded-lg z-10"
                    key={item}
                  >
                    <label className="flex items-center gap-2 w-full ml-20">
                      <input
                        type="checkbox"
                        className="ml-10"
                        name={item}
                        checked={checkedItems[category]?.includes(item)}
                        onChange={(event) => handleCheckChange(event, category)}
                      />
                      <span className="flex-1">{item}</span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="">
        <table className="mt-5 w-[80vw] m-auto border-black border border-spacing-5">
          <thead className=" bg-[#1DB954] border-2 border-black">
            <tr className="w-full m-auto grid items-center justify-center text-xl grid-cols-5 p-5">
              <th>S. No.</th>
              <th>Song</th>
              <th>Artist</th>
              <th>Genre</th>
              <th>Mood</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((crop, index) => (
              <tr
                key={index}
                className="w-full m-auto grid items-center justify-center text-xl grid-cols-5 p-5 border-[0.5px] border-slate-600"
              >
                <th>{index + 1}</th>
                <th>{crop.name}</th>
                <th>{crop.artist}</th>
                <th>{crop.genre}</th>
                <th>{crop.mood}</th>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default RecommendationsPage;
