<?php

namespace App\EventSubscriber;

use App\Entity\User; // <-- AJOUT INDISPENSABLE : on importe ton entité User
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class JWTCreatedSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            'lexik_jwt_authentication.on_jwt_created' => 'onJWTCreated',
        ];
    }

    public function onJWTCreated(JWTCreatedEvent $event): void
    {
        $user = $event->getUser();

        // On vérifie strictement que l'utilisateur est bien notre classe User
        if (!$user instanceof User) {
            return;
        }

        $payload = $event->getData();

        // L'éditeur sait maintenant que $user est un App\Entity\User, le soulignement disparaît
        $payload['id'] = $user->getId();

        $event->setData($payload);
    }
}
