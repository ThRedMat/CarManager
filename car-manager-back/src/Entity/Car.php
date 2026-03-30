<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Controller\CreateCarAction;
use App\Repository\CarRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\HttpFoundation\File\File;
use Vich\UploaderBundle\Mapping\Attribute as Vich;

#[ORM\Entity(repositoryClass: CarRepository::class)]
#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Post(
            controller: CreateCarAction::class,
            deserialize: false
        ),
        new Patch(
            inputFormats: ['json' => ['application/merge-patch+json']]
        ),
        new Delete()
    ],
    normalizationContext: ['groups' => ['car:read']],
    denormalizationContext: ['groups' => ['car:write']]
)]
#[Vich\Uploadable]
class Car
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['car:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['car:read', 'car:write'])]
    private ?string $brand = null;

    #[ORM\Column(length: 255)]
    #[Groups(['car:read', 'car:write'])]
    private ?string $model = null;

    #[ORM\Column(length: 255)]
    #[Groups(['car:read', 'car:write'])]
    private ?string $licensePlate = null;

    #[ORM\Column]
    #[Groups(['car:read', 'car:write'])]
    private ?int $currentKm = null;

    #[ORM\Column]
    #[Groups(['car:read', 'car:write'])]
    private ?int $nextServiceKm = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['car:read', 'car:write'])]
    private ?\DateTimeInterface $nextCtDate = null;

    // --- RELATION PROPRIÉTAIRE ---
    #[ORM\ManyToOne(inversedBy: 'cars')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['car:read'])]
    private ?User $owner = null;

    // --- CONFIGURATION VICH UPLOADER ---
    #[Vich\UploadableField(mapping: 'cars_images', fileNameProperty: 'imageName')]
    private ?File $imageFile = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['car:read'])]
    private ?string $imageName = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    // --- RELATION ENTRETIENS (Ajoutée pour corriger l'erreur 500) ---
    #[ORM\OneToMany(mappedBy: 'car', targetEntity: Entretien::class, orphanRemoval: true)]
    #[Groups(['car:read'])]
    private Collection $entretiens;

    public function __construct()
    {
        $this->entretiens = new ArrayCollection();
    }

    // --- GETTERS ET SETTERS ---

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getBrand(): ?string
    {
        return $this->brand;
    }

    public function setBrand(string $brand): static
    {
        $this->brand = $brand;
        return $this;
    }

    public function getModel(): ?string
    {
        return $this->model;
    }

    public function setModel(string $model): static
    {
        $this->model = $model;
        return $this;
    }

    public function getLicensePlate(): ?string
    {
        return $this->licensePlate;
    }

    public function setLicensePlate(string $licensePlate): static
    {
        $this->licensePlate = $licensePlate;
        return $this;
    }

    public function getCurrentKm(): ?int
    {
        return $this->currentKm;
    }

    public function setCurrentKm(int $currentKm): static
    {
        $this->currentKm = $currentKm;
        return $this;
    }

    public function getNextServiceKm(): ?int
    {
        return $this->nextServiceKm;
    }

    public function setNextServiceKm(int $nextServiceKm): static
    {
        $this->nextServiceKm = $nextServiceKm;
        return $this;
    }

    public function getNextCtDate(): ?\DateTimeInterface
    {
        return $this->nextCtDate;
    }

    public function setNextCtDate(?\DateTimeInterface $nextCtDate): static
    {
        $this->nextCtDate = $nextCtDate;
        return $this;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): static
    {
        $this->owner = $owner;
        return $this;
    }

    public function setImageFile(?File $imageFile = null): void
    {
        $this->imageFile = $imageFile;
        if (null !== $imageFile) {
            $this->updatedAt = new \DateTimeImmutable();
        }
    }

    public function getImageFile(): ?File
    {
        return $this->imageFile;
    }

    public function setImageName(?string $imageName): void
    {
        $this->imageName = $imageName;
    }

    public function getImageName(): ?string
    {
        return $this->imageName;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    /**
     * @return Collection<int, Entretien>
     */
    public function getEntretiens(): Collection
    {
        return $this->entretiens;
    }

    public function addEntretien(Entretien $entretien): static
    {
        if (!$this->entretiens->contains($entretien)) {
            $this->entretiens->add($entretien);
            $entretien->setCar($this);
        }

        return $this;
    }

    public function removeEntretien(Entretien $entretien): static
    {
        if ($this->entretiens->removeElement($entretien)) {
            // set the owning side to null (unless already changed)
            if ($entretien->getCar() === $this) {
                $entretien->setCar(null);
            }
        }

        return $this;
    }
}
