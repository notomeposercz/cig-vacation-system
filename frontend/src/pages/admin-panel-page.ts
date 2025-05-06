import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Layout from '../components/Layout';
import { apiService } from '../services/api.service';
import { vacationService } from '../services/vacation.service';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: {
    id: string;
    name: string;
  };
  vacationStats?: {
    total: number;
    used: number;
    remaining: number;
  };
}

interface Department {
  id: string;
  name: string;
}

interface VacationSetting {
  id: string;
  userId: string;
  year: number;
  totalDays: number;
  carriedDays: number;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [vacationSetting, setVacationSetting] = useState<VacationSetting | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<'users' | 'approvals'>('users');

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Načtení uživatelů s jejich statistikami
        const fetchedUsers = await apiService.get<User[]>(`/users/with-stats?year=${currentYear}`);
        setUsers(fetchedUsers);

        // Načtení oddělení
        const fetchedDepartments = await apiService.get<Department[]>('/departments');
        setDepartments(fetchedDepartments);
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
        setError('Nepodařilo se načíst data. Zkuste to prosím znovu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentYear]);

  // Načtení nastavení dovolené pro uživatele
  const fetchVacationSetting = async (userId: string) => {
    try {
      const setting = await vacationService.getVacationSettingByUserAndYear(
        userId,
        currentYear
      );
      setVacationSetting(setting);
      
      // Naplnění formuláře hodnotami
      formik.setValues({
        totalDays: setting.totalDays,
        carriedDays: setting.carriedDays,
      });
    } catch (err) {
      console.error('Failed to fetch vacation setting:', err);
      setVacationSetting(null);
      
      // Nastavení výchozích hodnot
      formik.setValues({
        totalDays: 25,
        carriedDays: 0,
      });
    }
  };

  // Výběr uživatele pro úpravu
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    fetchVacationSetting(user.id);
  };

  // Validační schéma pro formulář
  const validationSchema = Yup.object({
    totalDays: Yup.number()
      .required('Počet dnů je povinný')
      .min(0, 'Počet dnů musí být nezáporný')
      .max(100, 'Počet dnů je příliš vysoký'),
    carriedDays: Yup.number()
      .required('Počet přenesených dnů je povinný')
      .min(0, 'Počet přenesených dnů musí být nezáporný')
      .max(50, 'Počet přenesených dnů je příliš vysoký'),
  });

  // Inicializace formiku
  const formik = useFormik({
    initialValues: {
      totalDays: 25,
      carriedDays: 0,
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!selectedUser) return;

      setError(null);
      setSuccessMessage(null);

      try {
        if (vacationSetting) {
          // Aktualizace existujícího nastavení
          await vacationService.updateVacationSetting(vacationSetting.id, {
            userId: selectedUser.id,
            year: currentYear,
            totalDays: values.totalDays,
            carriedDays: values.carriedDays,
          });
        } else {
          // Vytvoření nového nastavení
          await vacationService.createVacationSetting({
            userId: selectedUser.id,
            year: currentYear,
            totalDays: values.totalDays,
            carriedDays: values.carriedDays,
          });
        }

        // Aktualizace seznamu uživatelů
        const updatedUsers = await apiService.get<User[]>(`/users/with-stats?year=${currentYear}`);
        setUsers(updatedUsers);

        // Zobrazení úspěšné zprávy
        setSuccessMessage('Nastavení dovolené bylo úspěšně uloženo.');

        // Aktualizace nastavení dovolené
        fetchVacationSetting(selectedUser.id);
      } catch (err) {
        console.error('Failed to save vacation setting:', err);
        setError('Nepodařilo se uložit nastavení dovolené.');
      }
    },
  });

  // Zpracování žádostí o schválení dovolené
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    if (tab === 'approvals') {
      const fetchPendingRequests = async () => {
        try {
          const requests = await vacationService.getAllVacationRequests();
          setPendingRequests(requests.filter(req => req.status === 'pending'));
        } catch (err) {
          console.error('Failed to fetch pending requests:', err);
        }
      };

      fetchPendingRequests();
    }
  }, [tab]);

  // Schválení/zamítnutí žádosti
  const handleVacationRequest = async (id: string, approved: boolean) => {
    try {
      if (approved) {
        await vacationService.approveVacationRequest(id, users[0]?.id || '');
      } else {
        await vacationService.rejectVacationRequest(id, users[0]?.id || '');
      }

      // Aktualizace seznamu žádostí
      const requests = await vacationService.getAllVacationRequests();
      setPendingRequests(requests.filter(req => req.status === 'pending'));

      setSuccessMessage(`Žádost byla úspěšně ${approved ? 'schválena' : 'zamítnuta'}.`);
    } catch (err) {
      console.error('Failed to process vacation request:', err);
      setError(`Nepodařilo se ${approved ? 'schválit' : 'zamítnout'} žádost.`);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Záložky */}
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">
            Vyberte záložku
          </label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            value={tab}
            onChange={(e) => setTab(e.target.value as any)}
          >
            <option value="users">Správa uživatelů</option>
            <option value="approvals">Schvalování dovolených</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setTab('users')}
                className={`${
                  tab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Správa uživatelů
              </button>
              <button
                onClick={() => setTab('approvals')}
                className={`${
                  tab === 'approvals'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Schvalování dovolených
              </button>
            </nav>
          </div>
        </div>

        {/* Chybová hláška */}
        {error && (
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Úspěšná hláška */}
        {successMessage && (
          <div className="bg-green-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Obsah záložky - Správa uživatelů */}
        {tab === 'users' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Seznam uživatelů */}
            <div className="md:col-span-2 bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {loading ? (
                  <li className="px-6 py-4 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                    <span>Načítání...</span>
                  </li>
                ) : users.length === 0 ? (
                  <li className="px-6 py-4 text-center text-gray-500">
                    Žádní uživatelé nebyli nalezeni.
                  </li>
                ) : (
                  users.map((user) => (
                    <li key={user.id}>
                      <button
                        className={`w-full px-6 py-4 flex items-center hover:bg-gray-50 focus:outline-none ${
                          selectedUser?.id === user.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="min-w-0 flex-1 flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                              {user.firstName.charAt(0)}
                              {user.lastName.charAt(0)}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1 px-4">
                            <div>
                              <p className="text-sm font-medium text-blue-600 truncate text-left">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-gray-500 truncate text-left">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex flex-col items-end">
                            <p className="text-sm text-gray-500">
                              {user.department?.name || 'Bez oddělení'}
                            </p>
                            <p className="text-xs text-gray-400 capitalize">
                              {user.role === 'admin'
                                ? 'Admin'
                                : user.role === 'manager'
                                ? 'Manažer'
                                : 'Zaměstnanec'}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Formulář pro úpravu dovolené */}
            <div className="bg-white shadow sm:rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Nastavení dovolené {currentYear}
                </h3>
              </div>

              {selectedUser ? (
                <div className="px-4 py-5 sm:p-6">
                  <form onSubmit={formik.handleSubmit}>
                    <div className="space-y-6">
                      <div>
                        <label
                          htmlFor="totalDays"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Počet dnů dovolené
                        </label>
                        <input
                          type="number"
                          id="totalDays"
                          name="totalDays"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={formik.values.totalDays}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                        />
                        {formik.touched.totalDays && formik.errors.totalDays ? (
                          <div className="mt-1 text-sm text-red-600">
                            {formik.errors.totalDays}
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <label
                          htmlFor="carriedDays"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Počet přenesených dnů
                        </label>
                        <input
                          type="number"
                          id="carriedDays"
                          name="carriedDays"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={formik.values.carriedDays}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                        />
                        {formik.touched.carriedDays && formik.errors.carriedDays ? (
                          <div className="mt-1 text-sm text-red-600">
                            {formik.errors.carriedDays}
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <button
                          type="submit"
                          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          disabled={formik.isSubmitting}
                        >
                          {formik.isSubmitting ? 'Ukládání...' : 'Uložit'}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Aktuální statistiky */}
                  {selectedUser.vacationStats && (
                    <div className="mt-6 bg-gray-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-900">
                        Aktuální statistiky
                      </h4>
                      <dl className="mt-2 grid grid-cols-3 gap-4">
                        <div>
                          <dt className="text-xs text-gray-500">Celkem</dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {selectedUser.vacationStats.total}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-gray-500">Využito</dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {selectedUser.vacationStats.used}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-gray-500">Zbývá</dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {selectedUser.vacationStats.remaining}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                  Vyberte uživatele ze seznamu pro úpravu nastavení dovolené.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Obsah záložky - Schvalování dovolených */}
        {tab === 'approvals' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {pendingRequests.length === 0 ? (
                <li className="px-6 py-4 text-center text-gray-500">
                  Žádné žádosti o dovolenou ke schválení.
                </li>
              ) : (
                pendingRequests.map((request) => (
                  <li key={request.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-blue-600">
                            {request.user?.firstName} {request.user?.lastName}
                          </div>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Čeká na schválení
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                          <div>
                            <span className="font-medium">Od:</span>{' '}
                            {new Date(request.startDate).toLocaleDateString('cs-CZ')}
                            {request.halfDayStart ? ' (půlden)' : ''}
                          </div>
                          <div>
                            <span className="font-medium">Do:</span>{' '}
                            {new Date(request.endDate).toLocaleDateString('cs-CZ')}
                            {request.halfDayEnd ? ' (půlden)' : ''}
                          </div>
                          <div>
                            <span className="font-medium">Typ:</span>{' '}
                            {request.type === 'vacation'
                              ? 'Dovolená'
                              : request.type === 'sick_leave'
                              ? 'Nemoc'
                              : 'Jiné'}
                          </div>
                        </div>
                        {request.note && (
                          <div className="mt-1 text-sm text-gray-500">
                            <span className="font-medium">Poznámka:</span> {request.note}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleVacationRequest(request.id, true)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Schválit
                        </button>
                        <button
                          onClick={() => handleVacationRequest(request.id, false)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Zamítnout
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminPanel;
