import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

const DataTable = ({ columns, data, onEdit, onDelete, renderActions }) => {
  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            {columns.map(col => <th key={col.key}>{col.label}</th>)}
            {(onEdit || onDelete || renderActions) && <th>عملیات</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={item.id || idx}>
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(item) : item[col.key]}
                </td>
              ))}
              {(onEdit || onDelete || renderActions) && (
                <td>
                  {renderActions ? renderActions(item) : (
                    <>
                      {onEdit && (
                        <button onClick={() => onEdit(item)} className="btn-icon">
                          <Edit2 size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(item.id)} className="btn-icon btn-delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;