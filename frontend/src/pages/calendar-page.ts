import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameMonth } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { vacationService, VacationRequest } from '../services/vacation.service';
import VacationRequestModal from '../components/VacationRequestModal';

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Načtení žádostí o dovolenou
  useEffect(() => {
    const fetchVacationRequests = async () => {
      setLoading(true);
      setError(null);

      try {
        // Získání rozsahu aktuálního měsíce
        const firstDay = startOfMonth(currentDate);
        const lastDay = endOfMonth(currentDate);

        // Načtení dovolených v daném rozsahu
        const requests = await vacationService.getVacationRequestsByDateRange(firstDay, lastDay);
        setVacationRequests(requests);
      } catch (err) {
        console.error('Failed to fetch vacation requests:', err);
        setError('Nepodařilo se načíst žádosti o dovolenou.');
      } finally {
        setLoading(false);
      }
    };

    fetchVacationRequests();
  }, [currentDate]);

  // Navigace v kalendáři
  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToPrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  // Generování kalendáře
  const generateCalendar = () => {
    const firstDay = startOfMonth(currentDate);
    const lastDay = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: firstDay, end: lastDay });

    // Získáme den v týdnu pro první den měsíce (0 = neděle, 1 = pondělí, ...)
    // Upraveno pro české prostředí (1 = pondělí, ... 7 = neděle)
    let startDay = getDay(firstDay);
    startDay = startDay === 0 ? 6 : startDay - 1; // Úprava pro začátek týdne v pondělí

    // Prázdné buňky před prvním dnem měsíce
    const blankDays = Array.from({ length: startDay }, (_, i) => (
      <div key={`blank-${i}`} className="border rounded-md min-h-24 bg-gray-50" />
    ));

    // Dny měsíce
    const monthDays = days.map((day) => {
      // Kontrola, zda má někdo dovolenou v tento den
      const dayVacations = vacationRequests.filter((vacation) => {
        const startDate = new Date(vacation.startDate);
        const endDate = new Date(vacation.endDate);
        
        return day >= startDate && day <= endDate;
      });

      return (
        <div
          key={day.toString()}
          className={`border rounded-md min-h-24 p-1 ${
            isToday(day) ? 'ring-2 ring-blue-500' : ''
          } ${
            isSameMonth(day, currentDate) ? 'bg-white' : 'bg-gray-50'
          } cursor-pointer`}
          onClick={() => {
            setSelectedDate(day);
            setIsModalOpen(true);
          }}
        >
          <div className="text-right p-1">
            <span className={`text-sm font-medium ${
              isToday(day) ? 'bg-blue-600 text-white p-1 rounded-full' : ''
            }`}>
              {format(day, 'd')}
            </span>
          </div>
          <div className="p-1 space-y-1">
            {dayVacations.map((vacation) => (
              <div
                key={vacation.id}
                className={`text-xs px-1.5 py-1 rounded ${
                  vacation.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : vacation.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100'
                }`}
              >
                {vacation.user?.firstName} {vacation.user?.lastName}
              </div>
            ))}
          </div>
        </div>
      );
    });

    return [...blankDays, ...monthDays];
  };

  // Zpracování vytvoření nové žádosti o dovolenou
  const handleVacationRequestCreate = async (newVacationRequest: any) => {
    try {
      await vacationService.createVacationRequest({
        ...newVacationRequest,
        userId: user?.id || '',
      });

      // Aktualizace seznamu dovolených
      const firstDay = startOfMonth(currentDate);
      const lastDay = endOfMonth(currentDate);
      const requests = await vacationService.getVacationRequestsByDateRange(firstDay, lastDay);
      setVacationRequests(requests);

      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create vacation request:', err);
      setError('Nepodařilo se vytvořit žádost o dovolenou.');
    }
  };

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow">
        {/* Kalendář header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {format(currentDate, 'LLLL yyyy', { locale: cs })}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                className="p-1.5 rounded-full hover:bg-gray-100"
                onClick={goToPrevMonth}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                className="p-1.5 rounded-full hover:bg-gray-100"
                onClick={goToNextMonth}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
            <button
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              onClick={() => {
                setSelectedDate(new Date());
                setIsModalOpen(true);
              }}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Nová dovolená
            </button>
          </div>
        </div>

        {/* Kalendář grid */}
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1">
            {/* Dny v týdnu */}
            {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((day) => (
              <div
                key={day}
                className="text-center py-2 text-sm font-medium text-gray-500"
              >
                {day}
              </div>
            ))}

            {/* Kalendářní buňky */}
            {loading ? (
              <div className="col-span-7 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Načítání...</p>
              </div>
            ) : error ? (
              <div className="col-span-7 py-12 text-center">
                <p className="text-red-500">{error}</p>
              </div>
            ) : (
              generateCalendar()
            )}
          </div>
        </div>
      </div>

      {/* Modal pro přidání dovolené */}
      {isModalOpen && (
        <VacationRequestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleVacationRequestCreate}
          initialDate={selectedDate || new Date()}
        />
      )}
    </Layout>
  );
};

export default Calendar;
