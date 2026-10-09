import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Clock,
  Layers,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { ExperimentStatus, Experiment } from '../../../types';
import { EmptyState } from '../../../components/common/EmptyState';

export const ExperimentsPage: React.FC = () => {
  const { experiments, setIsCreateModalOpen, viewExperimentDetails } = useApp();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<'All' | ExperimentStatus>('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filteredExperiments = experiments.filter((exp) => {
    const matchesStatus = statusFilter === 'All' || exp.status === statusFilter;
    const matchesSearch =
      exp.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      exp.type.toLowerCase().includes(searchFilter.toLowerCase()) ||
      exp.description.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleOpenDetails = (id: string) => {
    viewExperimentDetails(id);
    navigate(`/experiments/${id}`);
  };

  const getStatusBadge = (status: ExperimentStatus) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active
          </span>
        );
      case 'Planned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" />
            Planned
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Completed
          </span>
        );
    }
  };

  const getBestCvr = (exp: Experiment) => {
    if (exp.status === 'Planned') return 'N/A';
    const winningVariant = exp.variants.find((v) => v.isWinner) || exp.variants[0];
    return winningVariant?.conversionRate ? `${winningVariant.conversionRate}%` : 'N/A';
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Experiments
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create, manage, and compare marketing experiments.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Experiment</span>
        </button>
      </div>

      {/* Controls Bar: Filters, Search, View Mode */}
      <div className="card-clean p-3 sm:p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['All', 'Active', 'Planned', 'Completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                statusFilter === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab}
              {tab === 'All' && ` (${experiments.length})`}
              {tab === 'Active' && ` (${experiments.filter((e) => e.status === 'Active').length})`}
              {tab === 'Planned' &&
                ` (${experiments.filter((e) => e.status === 'Planned').length})`}
              {tab === 'Completed' &&
                ` (${experiments.filter((e) => e.status === 'Completed').length})`}
            </button>
          ))}
        </div>

        {/* Search & Grid/Table toggle */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter experiments..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-400 hover:text-slate-700'}`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-400 hover:text-slate-700'}`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Experiments Content: Grid View or Table View */}
      {filteredExperiments.length === 0 ? (
        <EmptyState
          icon={<FlaskConical className="w-7 h-7 text-indigo-600" />}
          title={
            searchFilter || statusFilter !== 'All'
              ? 'No experiments match this criteria'
              : 'No experiments yet'
          }
          description={
            searchFilter || statusFilter !== 'All'
              ? 'Try adjusting your search query or status filter to see other tests.'
              : 'Launch your first A/B or multivariate marketing experiment to optimize conversion rates.'
          }
          action={{
            label: '+ Create Experiment',
            onClick: () => setIsCreateModalOpen(true),
          }}
          secondaryAction={
            searchFilter || statusFilter !== 'All'
              ? {
                  label: 'Reset Filters',
                  onClick: () => {
                    setStatusFilter('All');
                    setSearchFilter('');
                  },
                }
              : undefined
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExperiments.map((exp) => {
            const isWinnerDetermined =
              exp.winnerName &&
              exp.winnerName !== 'Not available' &&
              exp.winnerName !== 'Evaluating initial traffic';
            return (
              <div
                key={exp.id}
                className="card-clean bg-white flex flex-col justify-between hover:shadow-card-hover hover:border-slate-300 transition-all group overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {exp.type}
                    </span>
                    {getStatusBadge(exp.status)}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {exp.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {exp.description}
                    </p>
                  </div>

                  {/* Dates & Variants Info */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {exp.startDate} → {exp.endDate}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {exp.variants.length} Variants
                    </span>
                  </div>

                  {/* Winner & Conversion Rate Metrics Box */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Conversion Rate:</span>
                      <span className="font-extrabold text-slate-900">{getBestCvr(exp)}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Winner:</span>
                      {isWinnerDetermined ? (
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-emerald-600" />
                          {exp.winnerName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">
                          {exp.winnerName || 'Not available'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Budget: ₹{exp.budget.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleOpenDetails(exp.id)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:text-indigo-800 transition-colors"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="card-clean bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Experiment</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Dates</th>
                  <th className="px-4 py-3.5">Variants</th>
                  <th className="px-4 py-3.5">Best CVR</th>
                  <th className="px-4 py-3.5">Winning Variant</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExperiments.map((exp) => {
                  const isWinnerDetermined =
                    exp.winnerName &&
                    exp.winnerName !== 'Not available' &&
                    exp.winnerName !== 'Evaluating initial traffic';
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleOpenDetails(exp.id)}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-left block"
                        >
                          {exp.name}
                        </button>
                        <span className="text-xs text-slate-400 font-normal">
                          Goal: {exp.primaryGoal}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(exp.status)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {exp.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                        {exp.startDate} → {exp.endDate}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-slate-700">
                        {exp.variants.length} Variants
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap font-bold text-slate-900">
                        {getBestCvr(exp)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {isWinnerDetermined ? (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                            {exp.winnerName}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {exp.winnerName || 'Not available'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleOpenDetails(exp.id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperimentsPage;
