import { Link } from "react-router";
import { motion, useInView } from "framer-motion";
import { useRef, memo } from "react";
import Social from "./Social";
import { IoLocationSharp } from "react-icons/io5";
import { MdPhoneIphone } from "react-icons/md";

const PHONE_NUMBERS = [
  { display: "০১৬৫০-০৩৩১৮১", tel: "01650033181" },
  { display: "০১৮০৪-৫৫৮২২৬", tel: "01804558226" },
];

interface FadeUpProps {
  children: React.ReactNode;
  delay?: number;
}

const FadeUp = memo(({ children, delay = 0 }: FadeUpProps) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
});
FadeUp.displayName = "FadeUp";

const Contact = () => (
  <footer className="bangla relative overflow-hidden mt-10 bg-[var(--color-bg)] text-[var(--color-text)]">
    {/* border */}
    <div className="w-full h-px my-16 bg-[var(--color-active-border)]" />

    <div className="relative z-10 w-full   text-[var(--color-gray)]">
      <FadeUp>
        <div className="mb-12">
          {/* Title */}
          <header className="text-center mb-10">
            <h1 className="text-2xl md:text-4xl font-bold">
              রয়েল একাডেমি, বেলকুচি
            </h1>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-8 md:gap-0">
            <div className="md:col-span-1 order-2 md:order-1 flex flex-col items-center  ">
              {/* যোগাযোগ block */}
              <div className="flex flex-row md:flex-col items-center justify-center gap-y-2 gap-x-10 ">
                <section>
                  <div className="flex items-center gap-x-2 ">
                    <IoLocationSharp className="text-lg flex-shrink-0" />
                    <p className="text-lg md:text-xl font-bold">যোগাযোগ</p>
                  </div>
                  <p className="text-md md:text-lg my-2 leading-relaxed">
                    মুকুন্দগাতী বাজার, <br /> বেলকুচি, সিরাজগঞ্জ
                  </p>
                </section>

                {/* Phone numbers */}
                <section className=" flex flex-col gap-x-2">
                  <div className="flex items-center gap-1 text-lg md:text-xl font-bold">
                    <MdPhoneIphone className="text-md flex-shrink-0" />
                    <span>মোবাইলঃ</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {PHONE_NUMBERS.map(({ display, tel }, i) => (
                      <motion.a
                        key={tel}
                        href={`tel:+88${tel}`}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + i * 0.1 }}
                        whileHover={{ x: -4 }}
                        className="text-md md:text-lg font-medium"
                      >
                        {display}
                      </motion.a>
                    ))}
                  </div>
                </section>
              </div>

              <div>
                <Social />
              </div>
            </div>

            <div className="md:col-span-5 order-1 md:order-2 px-3 md:px-0">
              <h2 className="text-lg md:text-xl font-bold mb-3">আমাদের কথাঃ</h2>
              <p className="text-justify text-md md:text-lg leading-relaxed">
                আসসালামু আলাইকুম। বেলকুচির সনামধন্য শিক্ষা প্রতিষ্ঠান রয়েল
                একাডেমির পক্ষ থেকে আপনাকে স্বাগতম। শিক্ষা মানুষের জীবনের সবচেয়ে
                মূল্যবান সম্পদ—এই বিশ্বাস নিয়ে আমরা প্রতিষ্ঠালগ্ন থেকে মানসম্মত
                শিক্ষা ও নৈতিক মূল্যবোধ গড়ে তোলার জন্য কাজ করে যাচ্ছি। অভিজ্ঞ
                শিক্ষক মণ্ডলীর মাধ্যমে পাঠ্য জ্ঞানের পাশাপাশি বাস্তব জীবনের
                দক্ষতা অর্জনে সহায়তা করা হয়। আমরা শিক্ষার্থীদের মেধা ও
                প্রতিভার বিকাশে গুরুত্ব দিয়ে আধুনিক ও প্রযুক্তিনির্ভর শিক্ষার
                মাধ্যমে তাদেরকে সৎ, দায়িত্বশীল ও আদর্শ নাগরিক হিসেবে গড়ে তুলতে
                প্রতিশ্রুতিবদ্ধ।
              </p>
            </div>
          </div>
        </div>
      </FadeUp>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="pb-20 md:pb-5 mt-10 border-t border-[var(--color-active-border)]"
      >
        <div className="md:mx-10 mt-10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-base">
            &copy; ২০২৪ হতে সর্বস্বত্ব সংরক্ষিত — রয়েল একাডেমি, বেলকুচি
          </p>
          <p className="text-base">
            Developed by{" "}
            <Link
              to="https://masudibnbelat.vercel.app"
              target="_blank"
              className="font-extrabold rubik underline"
            >
              Masud Ibn Belat
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  </footer>
);

export default Contact;
