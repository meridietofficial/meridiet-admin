import React from "react";

const GlobalPagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];

    // Always show first page
    pages.push(1);

    if (totalPages <= 7) {
      // If total pages <= 7, show all
      for (let i = 2; i <= totalPages; i++) pages.push(i);
    } else {
      // Determine start and end of middle range
      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);

      // Adjust if current is near beginning
      if (currentPage <= 4) {
        start = 2;
        end = 5;
      }

      // Adjust if current is near end
      if (currentPage >= totalPages - 3) {
        start = totalPages - 4;
        end = totalPages - 1;
      }

      // Ellipsis before middle
      if (start > 2) pages.push("...");
      // Middle pages
      for (let i = start; i <= end; i++) pages.push(i);
      // Ellipsis after middle
      if (end < totalPages - 1) pages.push("...");
      // Last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded-pill"
      >
        Prev
      </button>

      {getPageNumbers().map((page, idx) =>
        page === "..." ? (
          <span key={idx} style={{ padding: "0 8px" }}>
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className="px-3 py-1 rounded-pill"
            style={{
              backgroundColor: currentPage === page ? "#1364C0" : "#f0f0f0",
              color: currentPage === page ? "white" : "black",
              border: "none",
              cursor: "pointer",
            }}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded-pill"
      >
        Next
      </button>
    </div>
  );
};

export default GlobalPagination;
