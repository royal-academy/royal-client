import { useEffect } from "react";
import Hero from "../Hero/Hero";
import Notice from "../../pages/Notice/Notice";
import Principal from "../Intro/Principal";
import VicePrincipal from "../Intro/VicePrincipal";
import Teacher from "../Teachers/Teacher";
import DailyUpdateDLWE from "../DailyUpdateDLWE/DailyUpdateDLWE";
import Contact from "../Contact/Contact";

const Home = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="">
      <Hero />
      <Notice />
      <DailyUpdateDLWE />
      <Principal />
      <VicePrincipal />
      <Teacher />
      <Contact />
    </div>
  );
};

export default Home;
