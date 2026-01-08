"use client";

/**
 * 菜单树节点组件
 * @description 用于角色权限分配的菜单树节点
 * @requirements 4.6
 */

export type MenuTreeNode = {
  id: number;
  parentId: number;
  menuType: "D" | "M" | "B";
  menuName: string;
  permission: string | null;
  children?: MenuTreeNode[];
};

interface MenuTreeItemProps {
  node: MenuTreeNode;
  checkedIds: number[];
  expandedIds: number[];
  onToggleCheck: (node: MenuTreeNode) => void;
  onToggleExpand: (id: number) => void;
  level: number;
}

const typeLabel = {
  D: "目录",
  M: "菜单",
  B: "按钮",
};

export function MenuTreeItem({
  node,
  checkedIds,
  expandedIds,
  onToggleCheck,
  onToggleExpand,
  level,
}: MenuTreeItemProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.includes(node.id);
  const isChecked = checkedIds.includes(node.id);

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-50"
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleExpand(node.id)}
            className="flex h-5 w-5 items-center justify-center"
            aria-label={isExpanded ? "收起" : "展开"}
          >
            <svg
              className={`h-4 w-4 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ) : (
          <span className="w-5" />
        )}

        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => onToggleCheck(node)}
          className="rounded -gray-300"
        />

        <span className="flex-1 text-sm">{node.menuName}</span>

        <span
          className={`rounded px-1.5 py-0.5 text-xs ${
            node.menuType === "D"
              ? "bg-blue-100 text-blue-600"
              : node.menuType === "M"
              ? "bg-green-100 text-green-600"
              : "bg-orange-100 text-orange-600"
          }`}
        >
          {typeLabel[node.menuType]}
        </span>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <MenuTreeItem
              key={child.id}
              node={child}
              checkedIds={checkedIds}
              expandedIds={expandedIds}
              onToggleCheck={onToggleCheck}
              onToggleExpand={onToggleExpand}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
