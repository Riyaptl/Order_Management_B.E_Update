import React, { useState, useEffect } from 'react';
import { importCSVShop } from '../slice/shopSlice';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAreas } from '../slice/areaSlice';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from "../components/NavbarComponents";


const CSVImportPage = () => {
  const [file, setFile] = useState(null);
  const [areaId, setAreaId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { role } = useSelector((state) => state.auth);
  const { areas, loading: areaLoading } = useSelector((state) => state.area);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const getAreas = async () => {
      try {
        await dispatch(fetchAreas({})).unwrap();
      } catch {
        toast.error('Failed to fetch areas');
      }
    };

    getAreas();
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!areaId || !file) {
      toast('Please select an area and a CSV file', { icon: '⚠️' });
      return;
    }

    try {
      setIsSubmitting(true);
      await dispatch(importCSVShop({ areaId, file })).unwrap();
      toast.success('CSV imported successfully!');
      setFile(null);
    } catch (err) {
      toast.error(err.message || 'Failed to import CSV');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6  mx-auto bg-white rounded-lg shadow-md">

      <div className="flex justify-end md:justify-center mb-8">
          <Navbar />
      </div>
      <button
        onClick={() => navigate('/shops_list')}
        className="absolute top-4 left-4 flex items-center text-sm text-blue-600 hover:underline"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>
      <h2 className="text-2xl font-semibold mb-6 text-center">Import Shops via CSV</h2>

      <div className="max-w-xl mx-auto">


        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Area</label>
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
              disabled={areaLoading}
            >
              <option value="">-- Select Area --</option>
              {areas.map((area) => (
                <option key={area._id} value={area._id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 px-4 text-white rounded-md transition duration-200 ${isSubmitting ? 'bg-amber-300 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700'
              }`}
          >
            {isSubmitting ? 'Uploading...' : 'Upload CSV'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CSVImportPage;
