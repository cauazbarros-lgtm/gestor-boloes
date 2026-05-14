import { PlacarForm } from '@/components/admin/PlacarForm';

export default function NovoPlacarPage() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Novo jogo do dia</h1>
        <p className="text-gray-400 text-sm mt-1">Crie um palpite de placar exato</p>
      </div>
      <PlacarForm />
    </div>
  );
}
