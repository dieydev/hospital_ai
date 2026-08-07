FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5004
ENV ASPNETCORE_URLS=http://+:5004

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["services/HospitalAI.ExaminationService/HospitalAI.ExaminationService.csproj", "services/HospitalAI.ExaminationService/"]
COPY ["HospitalAI.Domain/HospitalAI.Domain.csproj", "HospitalAI.Domain/"]
COPY ["HospitalAI.Application/HospitalAI.Application.csproj", "HospitalAI.Application/"]
COPY ["HospitalAI.Infrastructure/HospitalAI.Infrastructure.csproj", "HospitalAI.Infrastructure/"]
RUN dotnet restore "services/HospitalAI.ExaminationService/HospitalAI.ExaminationService.csproj"
COPY . .
WORKDIR "/src/services/HospitalAI.ExaminationService"
RUN dotnet build "HospitalAI.ExaminationService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HospitalAI.ExaminationService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HospitalAI.ExaminationService.dll"]
