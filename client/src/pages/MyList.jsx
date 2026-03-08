import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import VideoCard from '../components/VideoCard';
import { Bookmark } from 'lucide-react';

export default function MyList() {
  const [myList, setMyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyList();
  }, []);

  const fetchMyList = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const { data } = await axios.get('/api/users/mylist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMyList(data);
    } catch (error) {
      console.error('Error fetching my list:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
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
        <h1 className="text-3xl lg:text-4xl font-bold mb-8">My List</h1>
        
        {myList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {myList.map(video => (
              <VideoCard key={video._id} video={video} onListChange={fetchMyList} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
              <Bookmark className="w-16 h-16 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your list is empty</h2>
            <p className="text-gray-400 mb-6">
              Add movies and shows to your list to watch them later
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
