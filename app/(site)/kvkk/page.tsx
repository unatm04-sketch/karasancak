import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/ui/page";

export const metadata: Metadata = { title: "KVKK Aydınlatma Metni" };

const SECTIONS = [
  {
    title: "Veri sorumlusu",
    body: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu Kara Sancak 1903 Taraftar Grubu'dur.",
  },
  {
    title: "İşlenen veriler",
    body: "Başvuru ve üyelik sırasında ad soyad, kullanıcı adı, e-posta, isteğe bağlı olarak telefon, şehir, tribün ve Instagram kullanıcı adı ile başvuru metnin işlenir. Sitedeki etkinliklerin (forum yazıları, mesajlar, beğeniler, XP hareketleri) kaydı tutulur. Şifren geri döndürülemez biçimde özetlenerek saklanır.",
  },
  {
    title: "İşleme amaçları",
    body: "Başvurunun değerlendirilmesi, üyeliğin yürütülmesi, forum ve mesajlaşma hizmetlerinin sunulması, seviye ve referans sisteminin işletilmesi ve kötüye kullanımın önlenmesi.",
  },
  {
    title: "Referans linki ziyaretleri",
    body: "Referans linklerine gelen ziyaretleri tekilleştirmek için IP adresi ve tarayıcı bilgisi tek yönlü özetlenerek kullanılır. Ham IP adresi veritabanına yazılmaz.",
  },
  {
    title: "Çerezler",
    body: "Oturumunu açık tutmak ve referans linkini başvuruya taşımak için zorunlu çerezler kullanılır. Reklam veya izleme çerezi kullanılmaz.",
  },
  {
    title: "Aktarım",
    body: "Verilerin, hizmetin çalışması için gerekli barındırma sağlayıcıları dışında üçüncü kişilere aktarılmaz.",
  },
  {
    title: "Hakların",
    body: "Kanunun 11. maddesi uyarınca verilerine erişme, düzeltilmesini veya silinmesini isteme haklarına sahipsin. Taleplerini grubun yönetimine iletebilirsin.",
  },
];

export default function KvkkPage() {
  return (
    <PageContainer className="max-w-3xl">
      <PageHeader title="KVKK Aydınlatma Metni" />
      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 leading-relaxed text-fog">{section.body}</p>
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
