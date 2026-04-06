import { supabase } from "./supabase";

const memberCache = new Map();
const childCache = new Map();

export const getMemberById = async (id) => {
  if (!id) return null;
  if (memberCache.has(id)) return memberCache.get(id);

  const { data, error } = await supabase
    .from("dcp_members")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("memberCache.getMemberById error:", error);
    return null;
  }

  if (data) {
    memberCache.set(id, data);
  }

  return data || null;
};

export const getChildrenById = async (parentId) => {
  if (childCache.has(parentId)) {
    return childCache.get(parentId);
  }

  const { data, error } = await supabase
    .from("dcp_members")
    .select("*")
    .eq("referred_by", parentId)
    .order("id", { ascending: true });

  if (error) {
    console.error("memberCache.getChildrenById error:", error);
    childCache.set(parentId, []);
    return [];
  }

  const children = data || [];
  childCache.set(parentId, children);

  children.forEach((child) => memberCache.set(child.id, child));

  return children;
};

export const clearMemberCache = () => {
  memberCache.clear();
  childCache.clear();
};
