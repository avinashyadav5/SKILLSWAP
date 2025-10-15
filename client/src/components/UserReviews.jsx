import { useEffect, useState } from "react";

function UserReviews({ ratedId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/rating/${ratedId}`)
      .then(res => res.json())
      .then(data => {
        setReviews(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ratedId]);

  if (loading) return <p>Loading reviews…</p>;
  if (reviews.length === 0) return <p>No reviews yet.</p>;

  return (
    <div className="bg-white/10 p-4 rounded-lg mt-2">
      <h3 className="text-lg font-semibold mb-2">User Reviews</h3>
      {reviews.map(review => (
        <div
          key={review.id}
          className="mb-3 p-2 border-b border-white/10 text-sm text-white"
        >
          <div>
            <span className="font-bold text-yellow-300">
              {'★'.repeat(review.stars)}
              {'☆'.repeat(5 - review.stars)}
            </span>
            <span className="ml-2 text-gray-400">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div>{review.review || <span className="italic text-gray-400">No message left.</span>}</div>
        </div>
      ))}
    </div>
  );
}

export default UserReviews;
