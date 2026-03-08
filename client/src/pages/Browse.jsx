import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import VideoCard from '../components/VideoCard';
import { Filter, SlidersHorizontal } from 'lucide-react';

export default function Browse() {
  const [searchParams] = useSearchParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [filterYear, setFilterYear] = useState('all');
  const [filterRating, setFilterRating] = useState('all');

  // Define categories based on type
  const getCategories = () => {
    const type = searchParams.get('type');
    
    if (type === 'youtube') {
      // Video categories
      return [
        { id: 'all', name: 'All' },
        { id: 'vlog', name: 'Vlog' },
        { id: 'tutorial', name: 'Tutorial' },
        { id: 'gaming', name: 'Gaming' },
        { id: 'music', name: 'Music' },
        { id: 'review', name: 'Review' },
        { id: 'educational', name: 'Educational' },
        { id: 'entertainment', name: 'Entertainment' },
        { id: 'sports', name: 'Sports' },
        { id: 'news', name: 'News' }
      ];
    } else if (type === 'netflix') {
      // Movie/TV genres
      return [
        { id: 'all', name: 'All' },
        { id: 'action', name: 'Action' },
        { id: 'comedy', name: 'Comedy' },
        { id: 'drama', name: 'Drama' },
        { id: 'horror', name: 'Horror' },
        { id: 'scifi', name: 'Sci-Fi' },
        { id: 'romance', name: 'Romance' },
        { id: 'thriller', name: 'Thriller' },
        { id: 'animation', name: 'Animation' },
        { id: 'documentary', name: 'Documentary' },
        { id: 'fantasy', name: 'Fantasy' },
        { id: 'crime', name: 'Crime' },
        { id: 'adventure', name: 'Adventure' },
        { id: 'mystery', name: 'Mystery' },
        { id: 'family', name: 'Family' }
      ];
    } else {
      // All categories for general browse
      return [
        { id: 'all', name: 'All' },
        // Video categories
        { id: 'vlog', name: 'Vlog' },
        { id: 'tutorial', name: 'Tutorial' },
        { id: 'gaming', name: 'Gaming' },
        { id: 'music', name: 'Music' },
        { id: 'review', name: 'Review' },
        { id: 'educational', name: 'Educational' },
        { id: 'sports', name: 'Sports' },
        // Movie/TV genres
        { id: 'action', name: 'Action' },
        { id: 'comedy', name: 'Comedy' },
        { id: 'drama', name: 'Drama' },
        { id: 'horror', name: 'Horror' },
        { id: 'scifi', name: 'Sci-Fi' },
        { id: 'romance', name: 'Romance' },
        { id: 'thriller', name: 'Thriller' },
        { id: 'animation', name: 'Animation' },
        { id: 'documentary', name: 'Documentary' },
        { id: 'fantasy', name: 'Fantasy' }
      ];
    }
  };

  const categories = getCategories();

  useEffect(() => {
    fetchVideos();
  }, [searchParams, selectedCategory, sortBy, filterYear, filterRating]);

  // Reset selected category when type changes
  useEffect(() => {
    setSelectedCategory('all');
  }, [searchParams.get('type')]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchParams.get('type')) params.append('type', searchParams.get('type'));
      if (searchParams.get('search')) params.append('search', searchParams.get('search'));
      
      // Add contentType filter from URL params (from navbar)
      if (searchParams.get('contentType')) {
        params.append('contentType', searchParams.get('contentType'));
      }
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      } else if (searchParams.get('category')) {
        params.append('category', searchParams.get('category'));
      }
      
      const { data } = await axios.get(`/api/videos?${params}`);
      
      // Apply client-side filtering and sorting
      let filteredData = [...data];
      
      // Filter out episodes - only show main series entries and regular videos
      // Episodes should only be accessible from within the series page
      filteredData = filteredData.filter(v => !v.isEpisode);
      
      // Filter by year
      if (filterYear !== 'all') {
        const year = parseInt(filterYear);
        filteredData = filteredData.filter(v => v.releaseYear === year);
      }
      
      // Filter by rating
      if (filterRating !== 'all') {
        filteredData = filteredData.filter(v => v.ageRating === filterRating);
      }
      
      // Sort
      switch (sortBy) {
        case 'newest':
          filteredData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'oldest':
          filteredData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case 'mostViewed':
          filteredData.sort((a, b) => b.views - a.views);
          break;
        case 'mostLiked':
          filteredData.sort((a, b) => b.likes.length - a.likes.length);
          break;
        case 'title':
          filteredData.sort((a, b) => a.title.localeCompare(b.title));
          break;
        default:
          break;
      }
      
      setVideos(filteredData);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (searchParams.get('search')) return `Search results for "${searchParams.get('search')}"`;
    
    // Show specific title based on contentType from navbar
    if (searchParams.get('contentType') === 'movie') return 'Movies';
    if (searchParams.get('contentType') === 'tvshow') return 'TV Series';
    
    if (searchParams.get('type') === 'netflix') return 'Movies & TV Shows';
    if (searchParams.get('type') === 'youtube') return 'Videos';
    if (searchParams.get('category')) {
      const cat = categories.find(c => c.id === searchParams.get('category'));
      return cat ? cat.name : 'Browse';
    }
    return 'Browse All';
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold">{getTitle()}</h1>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-8 pb-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-white text-black'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="mostViewed">Most Viewed</option>
                  <option value="mostLiked">Most Liked</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>

              {/* Filter by Year */}
              <div>
                <label className="block text-sm font-medium mb-2">Release Year</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix"
                >
                  <option value="all">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                  <option value="2019">2019</option>
                  <option value="2018">2018</option>
                  <option value="2017">2017</option>
                  <option value="2016">2016</option>
                  <option value="2015">2015</option>
                </select>
              </div>

              {/* Filter by Age Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">Age Rating</label>
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix"
                >
                  <option value="all">All Ratings</option>
                  <option value="G">G - General Audiences</option>
                  <option value="PG">PG - Parental Guidance</option>
                  <option value="PG-13">PG-13 - Parents Cautioned</option>
                  <option value="R">R - Restricted</option>
                  <option value="18+">18+ - Adults Only</option>
                </select>
              </div>
            </div>

            {/* Reset Filters Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSortBy('newest');
                  setFilterYear('all');
                  setFilterRating('all');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}

        {/* Results Count */}
        <p className="text-gray-400 mb-6">
          {videos.length} {videos.length === 1 ? 'result' : 'results'} found
        </p>

        {/* Videos Grid */}
        {videos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {videos.map(video => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
              <Filter className="w-16 h-16 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No results found</h2>
            <p className="text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
