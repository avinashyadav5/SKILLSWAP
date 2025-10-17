import { useEffect, useState } from "react";

function UserReviews({ ratedId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Use environment variable or local fallback
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (!ratedId) return;

    const fetchReviews = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${BACKEND_URL}/api/rating/${ratedId}`);
        if (!res.ok) throw new Error("Failed to fetch reviews");

        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError("⚠️ Unable to load reviews. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [ratedId]);

  if (loading) return <p className="text-gray-300">⏳ Loading reviews...</p>;
  if (error) return <p className="text-red-400">{error}</p>;
  if (reviews.length === 0)
    return <p className="text-gray-400">No reviews yet.</p>;

  return (
    <div className="bg-white/10 p-4 rounded-lg mt-2 text-white">
      <h3 className="text-lg font-semibold mb-3">⭐ User Reviews</h3>

      {reviews.map((review) => (
        <div
          key={review._id || review.id}
          className="mb-3 p-3 border-b border-white/10 bg-gray-800/40 rounded-lg"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-yellow-300">
              {"★".repeat(review.stars)}{" "}
              <span className="text-gray-500">
                {"☆".repeat(5 - review.stars)}
              </span>
            </span>
            <span className="text-xs text-gray-400">
              {review.createdAt
                ? new Date(review.createdAt).toLocaleDateString()
                : ""}
            </span>
          </div>

          <div className="text-sm">
            {review.review ? (
              <p>{review.review}</p>
            ) : (
              <p className="italic text-gray-400">No message left.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default UserReviews;
