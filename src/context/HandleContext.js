import React, { createContext, useState, useContext } from 'react';

// Create Context
const HandleContext = createContext();

// Provider Component
export const HandleProvider = ({ children }) => {
  const [handle, setHandle] = useState(""); // setHandle should be the correct function

  return (
    <HandleContext.Provider value={{ handle, setHandle }}>
      {children}
    </HandleContext.Provider>
  );
};

// Custom hook to access HandleContext
export const useHandle = () => {
  return useContext(HandleContext);
};
