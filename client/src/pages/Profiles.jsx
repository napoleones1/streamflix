import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, User } from 'lucide-react';

export default function Profiles() {
  const [profiles, setProfiles] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newProfile, setNewProfile] = useState({ name: '', isKids: false });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data } = await axios.get('/api/profiles');
      setProfiles(data);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/profiles', newProfile);
      setShowCreate(false);
      setNewProfile({ name: '', isKids: false });
      fetchProfiles();
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Who's watching?</h1>
        
        <div className="flex gap-6 justify-center flex-wrap">
          {profiles.map(profile => (
            <div 
              key={profile._id}
              onClick={() => navigate('/')}
              className="cursor-pointer group"
            >
              <div className="w-32 h-32 bg-gray-700 rounded-lg flex items-center justify-center group-hover:ring-4 ring-white transition">
                <User className="w-16 h-16" />
              </div>
              <p className="mt-2 text-gray-400 group-hover:text-white">{profile.name}</p>
            </div>
          ))}
          
          <div 
            onClick={() => setShowCreate(true)}
            className="cursor-pointer group"
          >
            <div className="w-32 h-32 bg-gray-700 rounded-lg flex items-center justify-center group-hover:ring-4 ring-white transition">
              <Plus className="w-16 h-16" />
            </div>
            <p className="mt-2 text-gray-400 group-hover:text-white">Add Profile</p>
          </div>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center">
            <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Create Profile</h2>
              <form onSubmit={handleCreateProfile}>
                <input
                  type="text"
                  placeholder="Profile Name"
                  value={newProfile.name}
                  onChange={(e) => setNewProfile({...newProfile, name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 rounded mb-4"
                  required
                />
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={newProfile.isKids}
                    onChange={(e) => setNewProfile({...newProfile, isKids: e.target.checked})}
                  />
                  Kids Profile
                </label>
                <div className="flex gap-4">
                  <button type="submit" className="flex-1 bg-netflix py-2 rounded">
                    Create
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 bg-gray-700 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
