import { useState, useEffect } from "react";
import "./App.css";
import ChatBot from "./ChatBot";

function App() {
  const [medicine, setMedicine] = useState("");
  const [dosage, setDosage] = useState("");
  const [date, setDate] = useState("");
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [times, setTimes] = useState([""]);
  const [reminders, setReminders] = useState(() => {
    const saved = localStorage.getItem("reminders");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeReminder, setActiveReminder] = useState(null);
  const [lastSpokenId, setLastSpokenId] = useState(null); 


  const VOICE_API_KEY = import.meta.env.VITE_VOICE_KEY;


  // Save reminders to localStorage whenever updated
  useEffect(() => {
    localStorage.setItem("reminders", JSON.stringify(reminders));
  }, [reminders]);

  // Adjust times input fields if user changes "timesPerDay"
  useEffect(() => {
    setTimes(Array(timesPerDay).fill(""));
  }, [timesPerDay]);

  const handleTimeChange = (index, value) => {
    const updatedTimes = [...times];
    updatedTimes[index] = value;
    setTimes(updatedTimes);
  };

  const handleAddReminder = (e) => {
    e.preventDefault();
    if (!medicine || !date || times.some((t) => !t)) return;

    const newReminder = {
      id: Date.now(),
      medicine,
      dosage,
      date,
      times,
    };

    setReminders([...reminders, newReminder]);
    setMedicine("");
    setDosage("");
    setDate("");
    setTimesPerDay(1);
    setTimes([""]);
  };

  const handleDelete = (id) => {
    setReminders(reminders.filter((rem) => rem.id !== id));
  };

  // Voice playback function
  const playVoice = async (text) => {
    try {
      const response = await fetch(
        "https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": VOICE_API_KEY,
            "Accept": "audio/mpeg",
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_monolingual_v1",
          }),
        }
      );

      if (!response.ok) throw new Error("Voice API failed");

      const audioData = await response.arrayBuffer();
      const blob = new Blob([audioData], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.play().catch((err) => console.error("Playback failed:", err));
    } catch (error) {
      console.error("Voice error:", error);
    }
  };

  // Check reminders every second
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = now.toTimeString().slice(0, 5);

      reminders.forEach((rem) => {
        if (rem.date === currentDate && rem.times.includes(currentTime)) {
          const reminderObj = { ...rem, currentTime };
          setActiveReminder(reminderObj);

          // ✅ Speak only once per reminder, not every second
          if (lastSpokenId !== rem.id + currentTime) {
            const voiceText = `Hi, it is ${currentTime}. Time to take ${rem.dosage || ""} ${rem.medicine}.`;
            playVoice(voiceText);
            setLastSpokenId(rem.id + currentTime);
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 1000);
    return () => clearInterval(interval);
  }, [reminders, lastSpokenId]);

  // When user clicks OK on popup
  const handleAcknowledge = () => {
    if (activeReminder) {
      const updatedReminders = reminders
        .map((rem) => {
          if (rem.id === activeReminder.id) {
            const newTimes = rem.times.filter(
              (t) => t !== activeReminder.currentTime
            );
            return { ...rem, times: newTimes };
          }
          return rem;
        })
        .filter((rem) => rem.times.length > 0);

      setReminders(updatedReminders);
    }
    setActiveReminder(null);
  };

  return (
    <div className="app">
      <ChatBot />
      <h1>Medication Reminder</h1>

      <form className="reminder-form" onSubmit={handleAddReminder}>
        <input
          type="text"
          placeholder="Medicine name"
          value={medicine}
          onChange={(e) => setMedicine(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Dosage (e.g. 1 tablet)"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <label>
          Times per day:
          <select
            value={timesPerDay}
            onChange={(e) => setTimesPerDay(Number(e.target.value))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>

        {times.map((time, idx) => (
          <input
            key={idx}
            type="time"
            value={time}
            onChange={(e) => handleTimeChange(idx, e.target.value)}
            required
          />
        ))}

        <button type="submit">Add Reminder</button>
      </form>

      <div className="reminder-list">
        <h2>Scheduled Medicines</h2>
        {reminders.length === 0 ? (
          <p>No reminders yet.</p>
        ) : (
          reminders.map((rem) => (
            <div key={rem.id} className="reminder-card">
              <p>
                <strong>{rem.medicine}</strong> — {rem.dosage || "No dosage"} on{" "}
                {rem.date}
              </p>
              <ul>
                {rem.times.map((t, i) => (
                  <li key={i}>⏰ {t}</li>
                ))}
              </ul>
              <button onClick={() => handleDelete(rem.id)}>❌</button>
            </div>
          ))
        )}
      </div>

      {/* Popup modal for active reminder */}
      {activeReminder && (
        <div className="popup">
          <div className="popup-content">
            <h2>💊 Reminder</h2>
            <p>
              Hi, it’s{" "}
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              and it’s time to take{" "}
              {activeReminder.dosage ? `${activeReminder.dosage} doses of ` : ""}
              <strong>{activeReminder.medicine}</strong>.
            </p>
            <button onClick={handleAcknowledge}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;











 