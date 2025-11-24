import React, { useState } from "react";
import emailjs from "emailjs-com";
import "./Contact.css";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: ""
  });

  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const sendEmail = (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.message) {
      setStatus("❌ All fields are required.");
      return;
    }

    emailjs
      .send(
        "service_dus8urj",      // 🔴 Replace with your EmailJS Service ID
        "template_c4wn2vf",     // 🔴 Replace with your EmailJS Template ID
        {
          from_name: form.name,
          from_email: form.email,
          message: form.message,
          to_email: "kanishak1610@gmail.com"
        },
        "sDE2dFVCAhQ9UIKUs"     // 🔴 Replace with EmailJS Public Key
      )
      .then(
        () => {
          setStatus("✅ Message sent successfully!");
          setForm({ name: "", email: "", message: "" });
        },
        (error) => {
          setStatus("❌ Failed to send message. Try again.");
          console.error(error);
        }
      );
  };

  return (
    <div className="contact-page">
      <h2 className="contact-title">📬 Contact Us</h2>

      <form className="contact-form" onSubmit={sendEmail}>
        <label>Name</label>
        <input
          type="text"
          name="name"
          placeholder="Enter your name"
          value={form.name}
          onChange={handleChange}
        />

        <label>Email</label>
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={form.email}
          onChange={handleChange}
        />

        <label>Your Query</label>
        <textarea
          name="message"
          placeholder="Describe your query..."
          value={form.message}
          onChange={handleChange}
        />

        <button className="glow-button contact-submit" type="submit">
          Send Message
        </button>

        {status && <p className="contact-status">{status}</p>}
      </form>

      <footer className="contact-footer">
        <p>Email: <a href="mailto:kanishak1610@gmail.com">kanishak1610@gmail.com</a></p>
        <p>LinkedIn: <a href="https://www.linkedin.com/in/kanishak16/" target="_blank" rel="noreferrer">
          https://www.linkedin.com/in/kanishak16/
        </a></p>
        <p className="dev-note">🚀 Developed by <strong>Kanishak Singh</strong></p>
      </footer>
    </div>
  );
}
