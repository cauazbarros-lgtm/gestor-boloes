import { BolaoForm } from '@/components/admin/BolaoForm';

export default function NovoBolaoPage() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Novo bolão</h1>
        <p className="text-gray-400 text-sm mt-1">Preencha os dados e adicione os jogos da rodada</p>
      </div>
      <BolaoForm />
    </div>
  );
}
