import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { vacationService, VacationRequest, VacationStats } from '../services/vacation.service';

const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [userVacations, setUserVacations] = useState<VacationRequest[]>([]);
  const [vacationStats, setVacationStats] = useState<VacationStats | null>(null);
  const [teamVacations, setTeamVacations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        // Načtení dovolených uživatele
        const userVacationRequests = await vacationService.getVacationRequestsByUser(user.id);
        setUserVacations(userVacationRequests);

        // Načtení statistik dovolené
        const currentYear = new Date().getFullYear();
        const stats = await vacationService.getVacationStats(user.id, currentYear);
        setVacationStats(stats);

        // Pro manažery a adminy načteme i týmové statistiky
        if (hasRole(['admin', 'manager'])) {
          const allUsers = await fetch('http://localhost:3001/users/with-stats').then(res => res.json());
          
          // Příprava dat pro graf
          const chartData = allUsers.map((user: any) => ({
            name: `${user.firstName} ${user.lastName}`,
            využitá: user.vacationStats.used,
            zbývající: user.vacationStats.remaining,
          }));
          
          setTeamVacations(chartData);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Nepodařilo se načíst data pro dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, hasRole]);

  // Příprava dat pro graf uživatele
  const prepareUserChartData = () => {
    if (!vacationStats) return [];

    return [
      {
        name: 'Dovolená',
        využitá: vacationStats.used,
        zbývající: vacationStats.remaining,
      },
    ];
  };

  // Status poslední žádosti
  const getLatestVacationStatus = () => {
    if (userVacations.length === 0) return null;

    // Seřazení podle data vytvoření (nejnovější první)
    const sortedVacations = [...userVacations].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sortedVacations[0];
  };

  const latestVacation = getLatestVacationStatus();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 p-4 rounded-md mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Chyba při načítání dat</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Statistiky uživatele */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Moje dovolená
            </h3>
          </div>

          <div className="p-6">
            {vacationStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-blue-800">Celkem dní</p>
                  <p className="mt-1 text-3xl font-semibold text-blue-900">
                    {vacationStats.total}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-green-800">Využito</p>
                  <p className="mt-1 text-3xl font-semibold text-green-900">
                    {vacationStats.used}
                  </p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-indigo-800">Zbývá</p>
                  <p className="mt-1 text-3xl font-semibold text-indigo-900">
                    {vacationStats.remaining}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Žádná data nejsou k dispozici.</p>
            )}

            {vacationStats && (
              <div className="mt-6 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareUserChartData()}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="využitá" fill="#10B981" />
                    <Bar dataKey="zbývající" fill="#6366F1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Poslední žádost o dovolenou */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Poslední žádost o dovolenou
            </h3>
          </div>

          <div className="p-6">
            {latestVacation ? (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Od</p>
                    <p className="mt-1 text-lg text-gray-900">
                      {new Date(latestVacation.startDate).toLocaleDateString('cs-CZ')}
                      {latestVacation.halfDayStart ? ' (půlden)' : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Do</p>
                    <p className="mt-1 text-lg text-gray-900">
                      {new Date(latestVacation.endDate).toLocaleDateString('cs-CZ')}
                      {latestVacation.halfDayEnd ? ' (půlden)' : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Typ</p>
                    <p className="mt-1 text-lg text-gray-900">
                      {latestVacation.type === 'vacation'
                        ? 'Dovolená'
                        : latestVacation.type === 'sick_leave'
                        ? 'Nemoc'
                        : 'Jiné'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          latestVacation.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : latestVacation.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {latestVacation.status === 'approved'
                          ? 'Schváleno'
                          : latestVacation.status === 'pending'
                          ? 'Čeká na schválení'
                          : 'Zamítnuto'}
                      </span>
                    </p>
                  </div>
                </div>
                {latestVacation.note && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-500">Poznámka</p>
                    <p className="mt-1 text-gray-900">{latestVacation.note}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">
                Nemáte žádné žádosti o dovolenou.
              </p>
            )}
          </div>
        </div>

        {/* Týmové statistiky (pouze pro manažery a adminy) */}
        {hasRole(['admin', 'manager']) && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Týmové statistiky
              </h3>
            </div>
            <div className="p-6">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={teamVacations}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="využitá" fill="#10B981" />
                    <Bar dataKey="zbývající" fill="#6366F1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
