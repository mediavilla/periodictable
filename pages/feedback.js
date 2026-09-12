import SubmissionPage from "../components/submissions/SubmissionPage";
import { SUBMISSION_TYPES } from "../data/submission-types";
import styles from "../styles/submission-page.module.css";

const type = SUBMISSION_TYPES.site_feedback;

export default function FeedbackPage() {
  return (
    <SubmissionPage type={type}>

    </SubmissionPage>
  );
}
