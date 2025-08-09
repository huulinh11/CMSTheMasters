import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { BenefitItem } from "@/types/benefit-configuration";

export const useRolePermissions = () => {
  const { data: masterTasks = [], isLoading: isLoadingTasks } = useQuery<{ id: string, name: string }[]>({
    queryKey: ['event_tasks_master'],
    queryFn: async () => {
      const { data, error } = await supabase.from('event_tasks_master').select('id, name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: masterBenefits = [], isLoading: isLoadingBenefits } = useQuery<BenefitItem[]>({
    queryKey: ['media_benefits_master'],
    queryFn: async () => {
      const { data, error } = await supabase.from('media_benefits_master').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: roleTasks = [], isLoading: isLoadingRoleTasks } = useQuery<{ role_name: string, task_name: string }[]>({
    queryKey: ['role_tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_tasks').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: roleBenefits = [], isLoading: isLoadingRoleBenefits } = useQuery<{ role_name: string, benefit_name: string }[]>({
    queryKey: ['role_benefits'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_benefits').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const tasksByRole = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const rt of roleTasks) {
      if (!map.has(rt.role_name)) {
        map.set(rt.role_name, []);
      }
      map.get(rt.role_name)!.push(rt.task_name);
    }
    return Object.fromEntries(map);
  }, [roleTasks]);

  const benefitsByRole = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const rb of roleBenefits) {
      if (!map.has(rb.role_name)) {
        map.set(rb.role_name, []);
      }
      map.get(rb.role_name)!.push(rb.benefit_name);
    }
    return Object.fromEntries(map);
  }, [roleBenefits]);

  return {
    allTasks: masterTasks.map(t => t.name),
    allBenefits: masterBenefits,
    tasksByRole,
    benefitsByRole,
    isLoading: isLoadingTasks || isLoadingBenefits || isLoadingRoleTasks || isLoadingRoleBenefits,
  };
};