import React from "react";
import { useTranslation } from "react-i18next";
import { useAdminData } from "@/contexts/AdminDataContext";
import { UserRow, ROLE_BADGES } from "@/components/feature/admin/types";

const SortIcon: React.FC<{ active: boolean; dir: "asc" | "desc" }> = ({ active, dir }) => {
  if (!active) return <span className="text-slate-300 ml-1">↕</span>;
  return <span className="text-blue-600 ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
};

const UsersTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    filteredUsers, users, roleFilter, setRoleFilter, userSearch, setUserSearch,
    userSort, setUserSort, isSuperAdmin, isAdmin, handleRoleChange, handleStatusToggle, handleDeleteUser, openUserDetail
  } = useAdminData();

  const toggleSort = (key: keyof UserRow) => {
    const dir = userSort.key === key && userSort.dir === "asc" ? "desc" : "asc";
    setUserSort({ key, dir });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder={t('admin.searchUsers')}
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          {(["all", "super_admin", "admin", "user"] as const).map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${roleFilter === r ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              {r === "all" ? t('admin.roles.all') : r === "super_admin" ? t('admin.roles.superAdmin') : t('admin.roles.' + r)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50">
                {(["name", "email", "role", "isActive", "createdAt"] as (keyof UserRow)[]).map((col) => (
                  <th key={col} onClick={() => toggleSort(col)} className="text-left px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 cursor-pointer hover:text-slate-600 select-none transition-colors">
                    <span className="flex items-center gap-2">{col === "isActive" ? t('admin.tableHeaders.status') : col === "createdAt" ? t('admin.tableHeaders.joined') : t('admin.tableHeaders.' + col)} <SortIcon active={userSort.key === col} dir={userSort.dir} /></span>
                  </th>
                ))}
                <th className="text-right px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('admin.tableHeaders.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                  <td className="px-6 py-5">
                    <button onClick={() => openUserDetail(u)} className="flex items-center gap-4 text-left group/btn">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 font-black text-sm group-hover/btn:scale-110 transition-transform">{u.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <span className="block font-black text-slate-800 group-hover/btn:text-blue-600 transition-colors">{u.name}</span>
                        <span className="text-[10px] font-bold text-slate-400">{t('admin.idLabel', { id: u.id })}</span>
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-5 text-slate-500 font-medium">{u.email}</td>
                  <td className="px-6 py-5">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border-2 ${ROLE_BADGES[u.role] || ROLE_BADGES.user}`}>{u.role === "super_admin" ? t('admin.roles.superAdmin') : t('admin.roles.' + u.role)}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border-2 ${u.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                      <span className={`w-2 h-2 rounded-full animate-pulse ${u.isActive ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                      {u.isActive ? t('admin.status.active') : t('admin.status.suspended')}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-400 font-medium text-xs">{new Date(u.createdAt).toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      {isSuperAdmin && (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="text-[10px] font-black uppercase tracking-widest border-2 border-slate-100 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer hover:border-blue-200 transition-all"
                        >
                          <option value="user">{t('admin.roles.user')}</option>
                          <option value="admin">{t('admin.roles.admin')}</option>
                          <option value="super_admin">{t('admin.roles.superAdmin')}</option>
                        </select>
                      )}
                      {(isSuperAdmin || (isAdmin && u.role === "user")) && (
                        <button
                          onClick={() => handleStatusToggle(u.id, u.isActive)}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${u.isActive ? "bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white" : "bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white"}`}
                          title={u.isActive ? t('admin.actions.suspendAccount') : t('admin.actions.activateAccount')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={u.isActive ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} /></svg>
                        </button>
                      )}
                      {isSuperAdmin && (
                        <button onClick={() => handleDeleteUser(u.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all" title={t('admin.actions.deleteAccount')}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <div>
              <h4 className="font-black text-slate-800">{t('admin.noUsersFound')}</h4>
              <p className="text-sm text-slate-400">{t('admin.adjustSearchFilters')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersTab;
