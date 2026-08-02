using HospitalAI.Domain.Entities;
using System.Collections.Generic;

namespace HospitalAI.Application.Interfaces;

public interface IJwtTokenGenerator
{
    (string Token, DateTime ExpiresAt) GenerateToken(User user, IEnumerable<string> roles);
}
