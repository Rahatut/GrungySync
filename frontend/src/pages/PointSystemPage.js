import React, { useState } from 'react';
import '../styles/PointSystemPage.css';

const PointSystemPage = () => {
  const [activeCategory, setActiveCategory] = useState('base');

  const pointCategories = {
    base: {
      title: "Base Activities",
      icon: "⚡",
      items: [
        { label: "Standard Posts & Logs", value: "10 pts / 100 chars", detail: "Minimum 10 pts per post. Longer, high-quality content earns more." },
        { label: "Media Attachments", value: "+25 pts / item", detail: "Adding images or videos increases the effort score of your action." },
        { label: "Uploads", value: "Effort-Based", detail: "Direct file uploads are scored based on the complexity of the contribution." }
      ]
    },
    bonuses: {
      title: "Special Bonuses",
      icon: "💎",
      items: [
        { label: "Learning & Reflection", value: "+20 pts", detail: "Marking your post as a 'Reflect' type grants a significant engagement bonus." },
        { label: "Iteration (Revisions)", value: "+15 pts", detail: "Improving upon your previous work via the 'Revise' feature is highly valued." },
        { label: "Earning Badges", value: "+50 pts", detail: "Each time you unlock a new achievement badge, you get a massive point boost." }
      ]
    },
    community: {
      title: "Community & Socials",
      icon: "🤝",
      items: [
        { label: "Giving Feedback", value: "Variable pts", detail: "Constructive feedback on others' work awards points to both you and the receiver." },
        { label: "Community Polls", value: "0 pts", detail: "Polls are purely for community interaction and decision-making." },
        { label: "Q&A Sessions", value: "0 pts", detail: "Questions and Answers foster knowledge sharing but don't count towards scores." }
      ]
    },
    limits: {
      title: "Caps & Multipliers",
      icon: "⚙️",
      items: [
        { label: "Daily Point Cap", value: "50 pts (Default)", detail: "Limits total points earned per day per hobby space to prevent spam." },
        { label: "Weekly Point Cap", value: "300 pts", detail: "Encourages consistent, long-term participation over short bursts." },
        { label: "Consistency Window", value: "7 Days", detail: "Points are tracked within a rolling window to maintain your ranking." }
      ]
    }
  };

  return (
    <div className="point-system-container">
      <div className="point-system-header">
        <h1 className="gradient-text">Point System</h1>
        <p>Your guide to mastering progress and rankings in Grungy</p>
      </div>

      <div className="point-system-tabs">
        {Object.keys(pointCategories).map((key) => (
          <button
            key={key}
            className={`tab-btn ${activeCategory === key ? 'active' : ''}`}
            onClick={() => setActiveCategory(key)}
          >
            <span className="tab-icon">{pointCategories[key].icon}</span>
            <span className="tab-label">{pointCategories[key].title}</span>
          </button>
        ))}
      </div>

      <div className="category-view glass">
        <div className="priority-list">
          {pointCategories[activeCategory].items.map((item, index) => (
            <div key={index} className="priority-item">
              <div className="item-rank">{index + 1}</div>
              <div className="item-content">
                <div className="item-header">
                  <span className="item-label">{item.label}</span>
                  <span className="item-value">{item.value}</span>
                </div>
                <p className="item-detail">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="summary-footer glass">
        <h3>Pro Tip 💡</h3>
        <p>
          Consistency is key! While a single high-effort Iteration can grant a quick <b>+15 pts</b>, 
          daily participation across different spaces will help you breach the <b>300 pts</b> weekly milestone 
          and climb the Global Leaderboard.
        </p>
      </div>
    </div>
  );
};

export default PointSystemPage;
