import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as solidStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as regularStar } from '@fortawesome/free-regular-svg-icons';

function RateUser({ raterId, ratedId }) {
  const [stars, setStars] = useState(5);
  const [hovered, setHovered] = useState(null);
  const [review, setReview] = useState('');

  // ✅ Use environment variable or fallback to local
  const BACKEND_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const submit = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raterId, ratedId, stars, review }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }

      alert('✅ Thanks for your feedback!');
      setReview('');
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('❌ Failed to submit feedback. Please try again later.');
    }
  };

  const handleClick = (index) => {
    setStars(index);
  };

  return (
    <div className="p-4 border rounded-md bg-white/10 text-white">
      <h3 className="text-lg font-bold mb-2">Rate This User</h3>
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <FontAwesomeIcon
            key={i}
            icon={i <= (hovered ?? stars) ? solidStar : regularStar}
            className="text-yellow-400 text-2xl cursor-pointer"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleClick(i)}
          />
        ))}
      </div>
      <textarea
        className="w-full mt-2 p-2 text-black rounded"
        placeholder="Write a review..."
        value={review}
        onChange={(e) => setReview(e.target.value)}
      />
      <button
        onClick={submit}
        className="mt-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
      >
        Submit
      </button>
    </div>
  );
}

export default RateUser;
