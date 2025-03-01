import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/member.css";

const Members = () => {
  const [members, setMembers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:5000/members")
      .then((res) => res.json())
      .then((data) => setMembers(data));
  }, []);

  return (
    <div className="members-container">
      <h1>Members</h1>
      <table className="members-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Outstanding Debt</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>{member.id}</td>
              <td>{member.name}</td>
              <td>{member.email}</td>
              <td>KES.{member.outstanding_debt.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="home" onClick={() => navigate("/")}>
        Home
      </button>
    </div>
  );
};

export default Members;