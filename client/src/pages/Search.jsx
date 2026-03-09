import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import VideoCard from '../components/VideoCard';
import { Search as SearchIcon, Filter } from 'lucide-react';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, video, movie, tvshow

  useEffect(() => {
    if (query) {
      searchVideos();
    }
  }, [query, filter]);

  const searchVideos = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/videos/search?q=${encodeURIComponent(query)}&filter=${filter}&limit=50`);
      // Filter out episodes - only show main series and regular videos
      const filtered = data.filter(v => !v.isEpisode);
      setResults(filtered);
    } catch (error) {
      console.error('Error searching videos:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-20 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-netflix"></div>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 sm:px-8 lg:px-16 min-h-screen bg-gray-900">
      <div className="max-w-[1920px] mx-auto py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            Search Results for "{query}"
          </h1>
          <p className="text-gray-400">
            {results.length} {results.length === 1 ? 'result' : 'results'} found
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                filter === 'all'
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('video')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                filter === 'video'
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              Videos
            </button>
            <button
              onClick={() => setFilter('movie')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                filter === 'movie'
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => setFilter('tvshow')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                filter === 'tvshow'
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              TV Shows
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {results.map(video => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
              <SearchIcon className="w-16 h-16 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No results found</h2>
            <p className="text-gray-400 mb-6">
              Try different keywords or browse our content
            </p>
            <Link
              to="/"
              className="inline-block bg-netflix px-8 py-3 rounded font-bold hover:bg-red-700 transition"
            >
              Browse Content
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
