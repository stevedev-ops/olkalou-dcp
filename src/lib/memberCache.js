import { api } from "./api";

const memberCache = new Map();
const childCache = new Map();



export const getChildrenById = async (parentId) => {
  if (childCache.has(parentId)) {
    return childCache.get(parentId);
  }

  const { data, error } = await api.getMembers({ referred_by: parentId });

  if (error) {
    console.error("memberCache.getChildrenById error:", error);
    childCache.set(parentId, []);
    return [];
  }

  const children = Array.isArray(data) ? data : (data.results || []);
  childCache.set(parentId, children);

  children.forEach((child) => memberCache.set(child.id, child));

  return children;
};

export const clearMemberCache = () => {
  memberCache.clear();
  childCache.clear();
};
