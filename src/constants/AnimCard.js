import React from "react";
import { motion } from "framer-motion";

const AnimCard = ({ children, className = "", ...rest }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.08)",
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`mb-2 ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default AnimCard;
