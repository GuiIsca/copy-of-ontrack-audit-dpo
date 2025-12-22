import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { getCurrentUser } from '../utils/auth';
import { useToast } from '../components/ui/Toast';

interface Department {
  id: number;
  name: string;
}

export const AderenteContactAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { show } = useToast();
  const currentUser = getCurrentUser();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | ''>('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await fetch('/api/admin-contacts/departments');
        if (!response.ok) throw new Error('Failed to fetch departments');
        const data = await response.json();
        setDepartments(data);
      } catch (error) {
        console.error('Error loading departments:', error);
        show('Não foi possível carregar os departamentos', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (!currentUser) {
      navigate('/');
      return;
    }

    loadDepartments();
  }, [currentUser, navigate, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDepartment || !message.trim()) {
      show('Por favor preencha todos os campos', 'error');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/admin-contacts/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aderente_id: currentUser.userId,
          department_id: selectedDepartment,
          message: message.trim()
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      setSubmitted(true);
      setSelectedDepartment('');
      setMessage('');

      show('Mensagem enviada com sucesso', 'success');

      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error('Error sending message:', error);
      show('Não foi possível enviar a mensagem', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-6 w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contacto com o Admin</h1>
          <p className="text-gray-600">Envie uma mensagem aos departamentos administrativos</p>
        </div>

        {submitted && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="text-green-600 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-green-900">Mensagem Enviada</h3>
              <p className="text-sm text-green-700 mt-1">
                A sua mensagem foi enviada com sucesso. O departamento responderá em breve.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Department Selection */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                Departamento <span className="text-red-500">*</span>
              </label>
              <select
                id="department"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mousquetaires focus:border-transparent"
              >
                <option value="">Selecione um departamento...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreva a sua mensagem aqui..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mousquetaires focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                {message.length} caracteres
              </p>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Informações</p>
                <p>A sua mensagem será enviada para o departamento selecionado. Certifique-se de fornecer detalhes claros sobre o assunto.</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/aderente/dashboard')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={sending || !selectedDepartment || !message.trim()}
                className="flex items-center gap-2"
              >
                <Send size={18} />
                {sending ? 'Enviando...' : 'Enviar Mensagem'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
