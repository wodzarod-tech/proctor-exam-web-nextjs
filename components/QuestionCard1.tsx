"use client"
import styles from "./QuestionCard.module.css"

const QuestionCard1 = () => { 
  return (
    <div className={styles.card}>

      <div className={styles.drag}>: : :</div>

      <div className={styles.questionHeader}>

        <div className={styles.qCounter}>
          1 de 1
        </div>
        
        {/* <button className={styles.deleteTest} */}

        <button className={`${styles.btnLink} ${styles.gTooltip} ${styles.deleteTop}`}
          data-tooltip="Delete question">
          {/*onclick="removeQuestion(this)">*/}
        <i className="fa-solid fa-trash"></i></button>
        
        <div className={styles.qPoints}>
          <input type="number"
            className={styles.pointsInput}
            min="0"
            step="0.1"
            placeholder="0" />
            {/*oninput="limitDecimals(this); updateJSON();" />*/}
          <span>points</span>
        </div>
      </div>
          
      <textarea className={styles.qTitle} placeholder="Question" rows="1"></textarea>

      <select className={styles.qType}> {/*onchange="updateOptions(this)">*/}
        <option value="radio">◉ One choice</option>
        <option value="checkbox">☑ Multiple choices</option>
      </select>

      <div className="options"></div>

      <div>
        <button className={styles.btnLink}>Add option</button> {/*onclick="addOption(this)">*/}
      </div>

      <div className={`${styles.feedback} ${styles.collapsed}`}>

        {/* Toggle header */}
        <div className={styles.feedbackToggle}>{/*onclick="toggleFeedback(this)">*/}
          <span className={styles.feedbackToggleIcon}>▼</span>
          <span className={styles.feedbackToggleText}>Answer feedback</span>
        </div>

        {/* Collapsible content */}
        <div className={styles.feedbackContent}>

          <div className={styles.feedbackGroup + " " + styles.ok}>
            <div className={styles.feedbackOkLabel}>
              <span className={styles.feedbackIcon}>✔</span>
              <span>Correct:</span>
            </div>
            <textarea className={`${styles.qTitle} ${styles.qCommentOk}`} rows="1" placeholder="Feedback"></textarea>
          </div>

          <div className={`${styles.feedbackGroup} ${styles.error}`}>
            <div className={styles.feedbackErrorLabel}>
              <span className={styles.feedbackIcon}>✖</span>
              <span>Incorrect:</span>
            </div>
            <textarea className={`${styles.qTitle} ${styles.qCommentError}`} rows="1" placeholder="Feedback"></textarea>
          </div>

        </div>
      </div>

      <div className={styles.actions}>
        <div className={styles.requiredToggle}>
          <span>Required</span>
          <label className={styles.switch}>
            <input type="checkbox" className={styles.qRequired} /> {/* onchange="updateJSON()"> */}
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>
    </div>
  )
}

export default QuestionCard1