<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;
use App\Repository\EntretienRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\HttpFoundation\File\File;

use Vich\UploaderBundle\Mapping\Annotation as Vich;

#[ORM\Entity(repositoryClass: EntretienRepository::class)]
#[Vich\Uploadable]
#[ApiResource(
    normalizationContext: ['groups' => ['entretien:read']],
    denormalizationContext: ['groups' => ['entretien:write']],
    operations: [
        new GetCollection(),
        new Get(security: "is_granted('ROLE_USER') and object.getCar().getOwner() == user"),

        // La modification cruciale est ici :
        new Post(
            security: "is_granted('ROLE_USER')",
            controller: \App\Controller\UploadEntretienAction::class, // <-- On lie le controleur
            deserialize: false, // <-- On interdit a API Platform de deballer lui-meme
            inputFormats: [
                'multipart' => ['multipart/form-data'],
                'jsonld' => ['application/ld+json']
            ]
        ),

        new Patch(security: "is_granted('ROLE_USER') and object.getCar().getOwner() == user"),
        new Delete(security: "is_granted('ROLE_USER') and object.getCar().getOwner() == user"),
    ]
)]
class Entretien
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['entretien:read', 'car:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 50)]
    #[Groups(['entretien:read', 'entretien:write', 'car:read'])]
    private ?string $type = null;

    #[ORM\Column(length: 255)]
    #[Groups(['entretien:read', 'entretien:write', 'car:read'])]
    private ?string $libelle = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['entretien:read', 'entretien:write', 'car:read'])]
    private ?\DateTimeImmutable $dateRealisation = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['entretien:read', 'entretien:write', 'car:read'])]
    private ?\DateTimeImmutable $dateProchaine = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['entretien:read', 'entretien:write', 'car:read'])]
    private ?int $kmRealise = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['entretien:read', 'entretien:write', 'car:read'])]
    private ?int $kmProchain = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['entretien:read', 'entretien:write', 'car:read'])]
    private ?string $garage = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['entretien:read', 'entretien:write', 'car:read'])]
    private ?float $montant = null;

    // --- NOUVEAUTES VICH UPLOADER ---

    // 1. Le fichier physique (qui ne va pas dans la base de donnees, d'ou l'absence de ORM\Column)
    #[Vich\UploadableField(mapping: 'entretien_invoices', fileNameProperty: 'invoiceName')]
    #[Groups(['entretien:write'])]
    public ?File $invoiceFile = null;

    // 2. Le nom du fichier (qui est sauvegarde en base de donnees)
    #[ORM\Column(nullable: true)]
    #[Groups(['entretien:read', 'car:read'])]
    private ?string $invoiceName = null;

    // 3. Date de mise a jour (necessaire pour VichUploader)
    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    // --------------------------------

    #[ORM\ManyToOne(inversedBy: 'entretiens')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['entretien:write', 'entretien:read'])]
    private ?Car $car = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getType(): ?string
    {
        return $this->type;
    }
    public function setType(string $v): static
    {
        $this->type = $v;
        return $this;
    }

    public function getLibelle(): ?string
    {
        return $this->libelle;
    }
    public function setLibelle(string $v): static
    {
        $this->libelle = $v;
        return $this;
    }

    public function getDateRealisation(): ?\DateTimeImmutable
    {
        return $this->dateRealisation;
    }
    public function setDateRealisation(?\DateTimeImmutable $v): static
    {
        $this->dateRealisation = $v;
        return $this;
    }

    public function getDateProchaine(): ?\DateTimeImmutable
    {
        return $this->dateProchaine;
    }
    public function setDateProchaine(?\DateTimeImmutable $v): static
    {
        $this->dateProchaine = $v;
        return $this;
    }

    public function getKmRealise(): ?int
    {
        return $this->kmRealise;
    }
    public function setKmRealise(?int $v): static
    {
        $this->kmRealise = $v;
        return $this;
    }

    public function getKmProchain(): ?int
    {
        return $this->kmProchain;
    }
    public function setKmProchain(?int $v): static
    {
        $this->kmProchain = $v;
        return $this;
    }

    public function getGarage(): ?string
    {
        return $this->garage;
    }
    public function setGarage(?string $v): static
    {
        $this->garage = $v;
        return $this;
    }

    public function getMontant(): ?float
    {
        return $this->montant;
    }
    public function setMontant(?float $v): static
    {
        $this->montant = $v;
        return $this;
    }

    public function getCar(): ?Car
    {
        return $this->car;
    }
    public function setCar(?Car $v): static
    {
        $this->car = $v;
        return $this;
    }

    // --- GETTERS & SETTERS UPLOAD ---

    public function setInvoiceFile(?File $invoiceFile = null): void
    {
        $this->invoiceFile = $invoiceFile;
        if (null !== $invoiceFile) {
            $this->updatedAt = new \DateTimeImmutable();
        }
    }

    public function getInvoiceFile(): ?File
    {
        return $this->invoiceFile;
    }

    public function setInvoiceName(?string $invoiceName): void
    {
        $this->invoiceName = $invoiceName;
    }

    public function getInvoiceName(): ?string
    {
        return $this->invoiceName;
    }

    // --- LOGIQUE INTELLIGENTE DES STATUTS ---

    #[Groups(['car:read'])]
    public function getStatut(): string
    {
        $now = new \DateTime();
        $car = $this->getCar();
        $currentKm = $car ? $car->getCurrentKm() : 0;

        if ($this->dateProchaine !== null && $this->dateProchaine < $now) {
            return 'alert';
        }
        if ($this->kmProchain !== null && $currentKm >= $this->kmProchain) {
            return 'alert';
        }

        if ($this->dateProchaine !== null) {
            $interval = $now->diff($this->dateProchaine);
            if ($interval->invert === 0 && $interval->days <= 30) {
                return 'warn';
            }
        }
        if ($this->kmProchain !== null && ($this->kmProchain - $currentKm) <= 1000) {
            return 'warn';
        }

        return 'ok';
    }
}
