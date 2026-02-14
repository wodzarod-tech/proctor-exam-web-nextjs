"use client"
import styles from "./TitleCard.module.css"

const TitleCard = () => { 
  return (
    <div className={styles.card}>
      {/* Form header */}
      <div className={styles.formHeaderRow}>
        <div>
          <input className={styles.titleInput} id="formTitle" placeholder="Title" />
          <input className={styles.descInput} id="formDesc" placeholder="Form description" />
        </div>

        <div className={styles.totalPoints}>
          <span>Total points</span>
          <strong id="totalPoints">0</strong>
        </div>
      </div>
    </div>
  )
}

export default TitleCard