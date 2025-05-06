import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';

// Supabase setup
const supabaseUrl = 'https://iynpsgrabdazwoyicmhr.supabase.co'; // Replace with your Supabase URL
const supabaseKey = 'your_supabase_key'; // Replace with your Supabase public key
const supabase = createClient(supabaseUrl, supabaseKey);

// Stripe setup
const stripePromise = loadStripe('pk_test_51R07PjG19RDmJD0Gogr004jfoFRdbm0bUYYBBuP316p7muWNgo7FGIgeqNUgstXy9gGhqmK0vOWptBqj3hnXAPPh00ziFFRkY8'); // Replace with your Stripe public key

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle user authentication
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession(); // Use getSession instead of session
      if (error) console.error('Error fetching session:', error);
      else setUser(session?.user ?? null);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' }); // Use signInWithOAuth
    if (error) console.error('Google login error:', error);
    else setUser(data.user);
    setLoading(false);
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out error:', error);
    else setUser(null);
  };

  // Handle payment
  const handlePayment = async (courseId, price) => {
    const stripe = await stripePromise;

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courseId, price }),
    });

    const session = await response.json();

    const { error } = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (error) console.error('Stripe error:', error);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <h1 className="text-3xl font-bold text-center">Welcome to ASPIRA Mentorship</h1>

      {!user ? (
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>
      ) : (
        <div className="mt-4">
          <p>Welcome, {user.email}!</p>
          <button
            onClick={signOut}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Example Payment Button */}
      <button
        onClick={() => handlePayment('course_123', 1000)} // Replace with actual course ID and price
        className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
      >
        Buy Course for $10
      </button>
    </div>
  );
}